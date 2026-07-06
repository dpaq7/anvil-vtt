# Phone Character Creator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the hero wizard effortless on phones — one decision per screen, minimal words, sticky Continue — without changing a pixel on desktop.

**Architecture:** All changes are rendering-only, gated by the existing phone rule `(max-width: 767px) and (pointer: coarse)`. A `subStepIndex`/`subStepCount` pair in `wizardStore` lets the layout's footer advance through decision screens within a step before advancing macro steps. New phone primitives live in `apps/vtt/src/components/creator/phone/`. Each step component keeps its desktop render and gains a phone screen list via a `PhoneDecisionFlow` wrapper. See the approved design: `docs/plans/2026-07-05-phone-character-creator-design.md`.

**Tech Stack:** React 19, TypeScript strict, Zustand, Tailwind (dark theme), lucide-react icons. No test infra exists in `apps/vtt` (vitest lives in `@anvil/data` only) — per-task verification is `pnpm --filter @anvil/vtt lint && pnpm build` (tsc via build catches type errors); behavioral verification is the manual walkthrough in the final task.

**Working directory:** `/Users/danpaquin/projects/Anvil v2/.claude/worktrees/phone-hero-wizard` (branch `feat/phone-hero-wizard`).

**Commit style:** imperative subject, no prefix (match `git log`), footer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Key constraint from CLAUDE.md:** components < 200 lines; `import type`; no `any`; Logic modules do all calculation (nothing here calculates — screens derive from existing `WizardLogic` calls already present in the steps).

---

### Task 1: Reactive phone-viewport hook

**Files:**
- Modify: `apps/vtt/src/lib/device.ts`
- Create: `apps/vtt/src/hooks/useIsPhoneViewport.ts`

**Step 1: Export the media query from device.ts**

```ts
// device.ts — add above isPhoneCompanionViewport, and use it inside:
export const PHONE_COMPANION_MEDIA_QUERY =
  '(max-width: 767px) and (pointer: coarse)';
```

**Step 2: Create the hook** (`useSyncExternalStore` so it re-renders on rotation/resize):

```ts
import { useSyncExternalStore } from 'react';
import { PHONE_COMPANION_MEDIA_QUERY } from '../lib/device.js';

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(PHONE_COMPANION_MEDIA_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(PHONE_COMPANION_MEDIA_QUERY).matches;
}

export function useIsPhoneViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
```

**Step 3: Verify** — `pnpm --filter @anvil/vtt lint && pnpm build`. Expected: clean.

**Step 4: Commit** — `Add reactive phone-viewport hook for the hero wizard`

---

### Task 2: Sub-step state in wizardStore

**Files:**
- Modify: `apps/vtt/src/stores/wizardStore.ts`

**Step 1: Add state + actions.** In the `WizardStore` interface add:

```ts
subStepIndex: number;
subStepCount: number;
setSubStepIndex: (index: number) => void;
registerSubStepCount: (count: number) => void;
```

Initial values `0` / `1`. `goToStep`, `reset`, and `loadFromSaved` must all also set `subStepIndex: 0, subStepCount: 1` (re-entering a step always starts at its first screen; not persisted to IndexedDB by design). `registerSubStepCount` sets the count and clamps `subStepIndex` to `count - 1` (screens can disappear when selections change). Important: `goToStep` must remain a no-op when `stepId` equals the current step id — otherwise re-clicking the active step (breadcrumb/steps sheet) resets `subStepCount` to 1 while `PhoneDecisionFlow`'s effect (deps: count) never re-registers, silently breaking sub-step navigation.

**Step 2: Make navigation sub-step aware.** In `useWizardNavigation`, read `subStepIndex`/`subStepCount`/`setSubStepIndex` and change:

```ts
const goBack = () => {
  if (subStepIndex > 0) { setSubStepIndex(subStepIndex - 1); return; }
  // ...existing macro-step logic (goToStep resets subStepIndex)
};

const goNext = () => {
  if (subStepIndex < subStepCount - 1) { setSubStepIndex(subStepIndex + 1); return; }
  // ...existing macro-step logic
};
```

`canGoBack` becomes `currentIndex > 0 || subStepIndex > 0`. Also return `subStepIndex` and `subStepCount` from the hook (the footer renders dots from them). Desktop is unaffected: nothing registers a count > 1 there, so `goNext`/`goBack` behave exactly as today.

**Step 3: Verify** — `pnpm --filter @anvil/vtt lint && pnpm build`. Clean.

**Step 4: Commit** — `Add sub-step navigation state to the wizard store`

---

### Task 3: Phone primitives

**Files (create, all under `apps/vtt/src/components/creator/phone/`):**
- `BottomSheet.tsx`, `ChoiceRow.tsx`, `DecisionScreen.tsx`, `PhoneDecisionFlow.tsx`, `index.ts`

**Step 1: `BottomSheet`** — follows the hand-rolled overlay idiom from `MobileSceneCreate.tsx:574` (no shared Sheet exists in `@anvil/ui`):

```tsx
import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-creator-border bg-creator-bg pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-creator-border" />
        {title && (
          <p className="shrink-0 px-4 pt-2 text-sm font-semibold text-creator-text">{title}</p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
```

**Step 2: `ChoiceRow`** — full-width tappable row, ≥44px target, info affordance:

```tsx
import { Check, Info } from 'lucide-react';
import { cn } from '@anvil/ui';

interface ChoiceRowProps {
  title: string;
  summary?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onInfo?: () => void;
}

export function ChoiceRow({ title, summary, selected, disabled, onSelect, onInfo }: ChoiceRowProps) {
  return (
    <div
      className={cn(
        'flex min-h-12 w-full items-center gap-2 rounded-lg border transition-colors',
        selected
          ? 'border-creator-highlight bg-creator-highlight/10'
          : 'border-creator-border bg-creator-card',
        disabled && 'opacity-40',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-creator-text">{title}</span>
          {summary && (
            <span className="block truncate text-xs text-creator-text-muted">{summary}</span>
          )}
        </span>
        {selected && <Check className="h-4 w-4 shrink-0 text-creator-highlight" />}
      </button>
      {onInfo && (
        <button
          type="button"
          onClick={onInfo}
          aria-label={`Details for ${title}`}
          className="flex size-11 shrink-0 items-center justify-center text-creator-text-muted"
        >
          <Info className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

**Step 3: `DecisionScreen`** — overline + question + single-column content + optional Skip:

```tsx
import type { ReactNode } from 'react';

interface DecisionScreenProps {
  overline?: string;   // "Career · choice 1 of 2"
  question: string;    // "Pick a skill from your upbringing"
  helper?: string;     // one line max — no rules preamble
  onSkip?: () => void; // renders "Skip for now" for optional decisions
  children: ReactNode;
}

export function DecisionScreen({ overline, question, helper, onSkip, children }: DecisionScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        {overline && (
          <p className="text-xs font-medium uppercase tracking-wider text-creator-text-muted">
            {overline}
          </p>
        )}
        <h2 className="mt-1 text-lg font-semibold text-creator-text">{question}</h2>
        {helper && <p className="mt-1 text-sm text-creator-text-muted">{helper}</p>}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 rounded-lg border border-creator-border text-sm text-creator-text-muted"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
```

**Step 4: `PhoneDecisionFlow`** — the bridge between step components and the store:

```tsx
import { useEffect, type ReactNode } from 'react';
import { useWizardStore } from '../../../stores/wizardStore.js';
import { useIsPhoneViewport } from '../../../hooks/useIsPhoneViewport.js';

export interface DecisionScreenSpec {
  id: string;
  render: () => ReactNode; // a <DecisionScreen> element
}

interface PhoneDecisionFlowProps {
  screens: DecisionScreenSpec[];
  desktop: ReactNode; // today's rendering, untouched
}

export function PhoneDecisionFlow({ screens, desktop }: PhoneDecisionFlowProps) {
  const isPhone = useIsPhoneViewport();
  const subStepIndex = useWizardStore((s) => s.subStepIndex);
  const registerSubStepCount = useWizardStore((s) => s.registerSubStepCount);
  const count = isPhone ? Math.max(screens.length, 1) : 1;

  useEffect(() => {
    registerSubStepCount(count);
  }, [count, registerSubStepCount]);

  if (!isPhone) return <>{desktop}</>;
  const active = screens[Math.min(subStepIndex, screens.length - 1)];
  return <>{active?.render()}</>;
}
```

**Step 5: `index.ts`** exporting all five, and re-export from `apps/vtt/src/components/creator/index.ts`.

**Step 6: Verify** — `pnpm --filter @anvil/vtt lint && pnpm build`. Clean (components are as-yet unused; keep them exported so lint doesn't flag dead files).

**Step 7: Commit** — `Add phone decision-screen primitives for the hero wizard`

---

### Task 4: Phone chrome — header, steps sheet, footer

**Files:**
- Create: `apps/vtt/src/components/creator/phone/PhoneStepHeader.tsx`
- Create: `apps/vtt/src/components/creator/phone/PhoneStepsSheet.tsx`
- Modify: `apps/vtt/src/components/creator/HeroCreatorLayout.tsx`

**Step 1: `PhoneStepsSheet`** — a `BottomSheet` listing every step: label, `Check` icon when `getStepStatus(step.id) === 'complete'`, current step highlighted with `text-creator-highlight`; row tap calls `onStepClick(step.id)` then closes. Rows `min-h-11`. Props: `{ open, onClose, steps, currentStepId, getStepStatus, onStepClick }` — the exact prop shapes `BreadcrumbNav` already receives (`BreadcrumbNav.tsx:5-10`).

**Step 2: `PhoneStepHeader`** — replaces the breadcrumb on phone:

```
[←]  STEP 6 OF 16          ⌄
     Skills
[━━━━━━━━──────────────────]  ← h-1 progress bar, width = (currentIndex+1)/steps.length
```

- Back arrow: `size-11`, calls `goBack`, `disabled={!canGoBack}`.
- Center block is a button opening `PhoneStepsSheet` (chevron-down signals tap-ability).
- Header owns the sheet's `open` state.
- Props: `{ steps, currentStepId, currentIndex, canGoBack, onBack, getStepStatus, onStepClick }`.

**Step 3: Wire into `HeroCreatorLayout`.** Add `const isPhone = useIsPhoneViewport()`. Then:

- Chrome: `{isPhone ? <PhoneStepHeader .../> : <BreadcrumbNav .../>}`.
- The step-label `<h2>` block (`HeroCreatorLayout.tsx:54-58`) is hidden on phone (header already names the step; DecisionScreens ask the question): wrap with `{!isPhone && (...)}`.
- Footer, phone variant: Back ghost button and primary button grow to `h-12 flex-1 max-w-40`, primary label becomes **Continue** (still `Create Hero` on the last macro step, `Saving...` while saving). Between them, when `subStepCount > 1`, render sub-progress dots (`subStepCount` ≤ ~6 in practice): filled dot for `i <= subStepIndex`. When `subStepCount === 1` keep the `Step X of Y` text. Add `pb-[env(safe-area-inset-bottom)]`.
- `useWizardNavigation` already returns `subStepIndex`/`subStepCount` after Task 2; `goNext`/`goBack` are already sub-step aware — the footer buttons don't change their handlers.
- The save guard changes from `isLastStep` to `isLastStep && subStepIndex === subStepCount - 1` (harmless today, correct once Review sub-paginates).

Desktop renders byte-identical DOM (all changes behind `isPhone`).

**Step 4: Verify** — lint + build clean. Quick sanity: `pnpm --filter @anvil/vtt dev`, open `/app/heroes/new` in a 390×844 viewport (DevTools device mode — `pointer: coarse` requires device emulation, not just a narrow window): compact header + progress bar + step sheet work; desktop viewport still shows the breadcrumb.

**Step 5: Commit** — `Replace wizard breadcrumb with compact phone header and step sheet`

---

### Task 5: SplitViewSelector phone mode — list + detail peek sheet

**Files:**
- Modify: `apps/vtt/src/components/creator/SplitViewSelector.tsx`

This one change upgrades every selector step (Ancestry, Culture presets, Career, Class, Subclass, Complication, Kit, Abilities) on phone.

**Step 1:** Add `const isPhone = useIsPhoneViewport()` and `const [sheetOpen, setSheetOpen] = useState(false)`. Phone branch replaces the stacked two-pane (`SplitViewSelector.tsx:46-79`):

```tsx
if (isPhone) {
  return (
    <>
      <div className="flex flex-col gap-2 pb-2">
        {items.map((item, index) => {
          const itemId = (item as { id?: string }).id ?? String(index);
          return (
            <div key={itemId} onClick={() => { onPreview(item); setSheetOpen(true); }}>
              {renderCard(item, itemId === selectedId, item === previewedItem)}
            </div>
          );
        })}
      </div>
      <BottomSheet open={sheetOpen && previewedItem !== null} onClose={() => setSheetOpen(false)}>
        {previewedItem && renderDetail(previewedItem)}
      </BottomSheet>
    </>
  );
}
```

**Step 2:** Close the sheet when a selection lands (the `DetailPanel` Select button inside `renderDetail` patches the character; `selectedId` changes):

```tsx
useEffect(() => {
  if (isPhone) setSheetOpen(false);
}, [selectedId, isPhone]);
```

Hooks go before the `items.length === 0` early return (rules of hooks). No nested `ScrollArea` on phone — the layout's content area scrolls. `renderDetail` output already ends in a full-width Select button (`DetailPanel.tsx:37-43`), which becomes the sheet's action — no per-step changes needed.

**Step 3: Verify** — lint + build; in the 390×844 emulator, Ancestry/Class steps now show a single-column card list, tapping a card peeks details with Select, selecting closes the sheet. Desktop two-pane unchanged at 1280px.

**Step 4: Commit** — `Peek details in a bottom sheet for phone selector steps`

---

### Task 6: SkillsStep — exemplar dense-step conversion

**Files:**
- Modify: `apps/vtt/src/components/wizard/SkillsStep.tsx`

This is the template for Tasks 7–8; follow it closely.

**Step 1:** Extract today's entire return JSX into a local `renderDesktop()` (zero changes to it). Build screens from the existing `skillSources` memo (`SkillsStep.tsx:84-215`) — skip granted sources on phone (nothing to decide; their skills surface on the Review screen):

```tsx
const selectableSources = skillSources.filter((s) => !s.isGranted);
const [peek, setPeek] = useState<Skill | null>(null);

const screens: DecisionScreenSpec[] = selectableSources.map((source, i) => ({
  id: source.id,
  render: () => (
    <DecisionScreen
      overline={`Skills · ${i + 1} of ${selectableSources.length} — ${source.label}`}
      question="Pick a skill"
      helper={source.description}
    >
      {getAvailableSkillsForSource(source.skillGroups).map((skill) => {
        const isSelected = source.selectedSkill === skill.name;
        const isTaken = /* same isAlreadyTaken logic as desktop (SkillsStep.tsx:313-320) */;
        return (
          <ChoiceRow
            key={skill.id}
            title={skill.name}
            summary={skillGroups[skill.group]?.name}
            selected={isSelected}
            disabled={isTaken}
            onSelect={() => handleSelectSkill(source.id, skill.name)}
            onInfo={() => setPeek(skill)}
          />
        );
      })}
    </DecisionScreen>
  ),
}));

return (
  <>
    <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />
    <BottomSheet open={peek !== null} onClose={() => setPeek(null)} title={peek?.name}>
      <p className="text-sm text-creator-text">{peek?.description}</p>
    </BottomSheet>
  </>
);
```

Verbal simplification: the question is three words; provenance lives in the overline; the desktop-only intro paragraph ("Your skills come from your culture, career, and class…") does not render on phone. If `screens.length === 0` pass a single informational screen ("Select your culture and career first").

**Step 2:** If the file exceeds the 200-line component rule, extract the phone screens into `apps/vtt/src/components/wizard/phone/SkillsScreens.tsx` (create `wizard/phone/` on first need; same pattern available to Tasks 7–8).

**Conversion contract (Tasks 7–16 copy this — established by the Task 6 exemplar):**
- Builder extraction to `wizard/phone/<Step>Screens.tsx` is **unconditional**, not just when the step file exceeds 200 lines.
- Builders are hook-free functions: props in, `DecisionScreenSpec[]` out. They always return ≥ 1 screen — guard/empty branches (nothing chosen yet, all granted, no slots) become single informational screens so the flow still registers a count.
- Builders take a minimal structural interface plus the step's helpers/callbacks as closures — never import a step's internal types or functions (avoids circular imports).
- Do **not** memoize screens or builder inputs — fresh closures on every render are what keep the screens staleness-proof against store updates.
- Peek state lives in the step component; the `BottomSheet` sits outside `PhoneDecisionFlow` (its backdrop covers the footer, so Continue can't fire while a sheet is open). Pass `desktop={renderDesktop}` — the prop is a lazy `() => ReactNode`, never an invoked element.
- Use single quotes in `wizard/phone/` files (repo style for new files, matching `creator/phone/`).

**Step 3: Verify** — lint + build; emulator: Skills is now one source per screen with footer dots; desktop unchanged.

**Step 4: Commit** — `Sub-paginate the Skills step on phone`

---

### Task 7: PerksStep — one screen per perk slot

**Files:** Modify `apps/vtt/src/components/wizard/PerksStep.tsx` (+ optional `wizard/phone/PerksScreens.tsx`)

Same recipe as Task 6. Slots already exist: `getPerkSlots(character)` (`PerksStep.tsx:56-73`). One `DecisionScreen` per slot: overline `Perks · ${i+1} of ${slots.length} — ${slot.label}`, question `Pick a perk`, helper from `slot.description`. `ChoiceRow` per eligible perk (reuse the step's existing per-slot filtering and cross-slot "already selected" logic, `PerksStep.tsx:84-121,214`), summary = perk category/one-liner, info peeks the full perk text in a `BottomSheet`. Desktop untouched. Verify, then commit — `Sub-paginate the Perks step on phone`.

---

### Task 8: AbilitiesStep — one screen per ability slot

**Files:** Modify `apps/vtt/src/components/wizard/AbilitiesStep.tsx` (+ `wizard/phone/AbilitiesScreens.tsx` — at 623 lines this step MUST extract)

Slots exist: `slots` memo (`AbilitiesStep.tsx:95`), including summoner minion slots. One `DecisionScreen` per slot: overline `Abilities · ${i+1} of ${slots.length} — ${slot.label}`, question `Pick an ability`. `ChoiceRow` summary: ability cost/type one-liner; info peeks the full ability card — reuse the existing `renderDetail`/`renderMinionDetail` (`AbilitiesStep.tsx:240,329`) inside the `BottomSheet` rather than rebuilding ability formatting. Preserve the guard branches (no class / no slots / no abilities, `AbilitiesStep.tsx:423-451`) as single informational screens on phone. Desktop's slot-tab UI untouched. Verify, then commit — `Sub-paginate the Abilities step on phone`.

---

### Task 9: CultureStep — one screen per aspect

**Files:** Modify `apps/vtt/src/components/wizard/CultureStep.tsx` (+ optional extraction)

Screens (bespoke path): 1) `Choose a culture` (preset list incl. bespoke option — `ChoiceRow` per preset, info peeks preset details), 2) `Pick an environment`, 3) `Pick an organization`, 4) `Pick an upbringing` — each a `ChoiceRow` list from the existing `GameData.getCulturesByType(...)` arrays with info peeks. When a professional preset is chosen (`selectPreset`, `CultureStep.tsx:74`), screens 2–4 drop out — `registerSubStepCount` already clamps the index, and `PhoneDecisionFlow` re-registers on length change. Overlines `Culture · X of Y`. Desktop untouched. Verify (flip between preset and bespoke; dot count updates), commit — `Sub-paginate the Culture step on phone`.

---

### Task 10: CareerStep — career pick + inciting incident

**Files:** Modify `apps/vtt/src/components/wizard/CareerStep.tsx`

Screen 1: `Choose your career` — the existing SplitViewSelector list (Task 5 already made it phone-friendly; wrap it as the screen's content). Screen 2 (only once a career is selected): `Pick an inciting incident`, overline `Career · 2 of 2`, `ChoiceRow` per incident with info peek for full text. Commit — `Split career and inciting incident on phone`.

---

### Task 11: AncestryStep — ancestry pick + traits

**Files:** Modify `apps/vtt/src/components/wizard/AncestryStep.tsx`

Screen 1: `Choose your ancestry` (SplitViewSelector content). Screen 2 (only when the chosen ancestry has trait choices — `TraitSelector`, currently rendered inline): `Choose your traits`, helper showing remaining points (the selector already tracks them). Keep `TraitSelector` as the screen content but single-column; if it needs layout surgery, do it with `isPhone`-conditional classes inside `TraitSelector.tsx`. Remove the `h-[70dvh]` fixed-height wrapper on phone (natural page scroll). Commit — `Split ancestry and traits on phone`.

---

### Task 12: Class, Subclass, Kit, Complication — single screens + Skip

**Files:** Modify `ClassStep.tsx`, `SubclassStep.tsx`, `KitStep.tsx`, `ComplicationStep.tsx`

All are SplitViewSelector-based, so Task 5 did the heavy lifting. Per step: wrap in `PhoneDecisionFlow` with a single `DecisionScreen` (question: `Choose your class` / `Choose your subclass` / `Choose your kit`), dropping the desktop intro paragraphs from the phone render. Specifics:
- **Subclass:** classes that pick twice (Conduit domains) get one screen per pick, overline `Subclass · X of 2`.
- **Kit:** second screen for the secondary kit only when the character is entitled to one (the step already knows).
- **Complication:** optional — `DecisionScreen onSkip={goNext}` (get `goNext` from `useWizardNavigation`), question `Add a complication?`.

Remove phone fixed-height wrappers as in Task 11. One commit — `Convert selector steps to phone decision screens`

---

### Task 13: CharacteristicsStep — single-column assignment

**Files:** Modify `apps/vtt/src/components/wizard/CharacteristicsStep.tsx`

One screen (no sub-pagination): overline `Characteristics`, question `Assign your scores`, helper naming the class array (e.g. "Distribute 2, 2, 1, 1, 0"). Phone render: one full-width row per characteristic (Might/Agility/Reason/Intuition/Presence) with the value picker ≥44px; the desktop grid stays. This step is visual-only — assignment logic untouched. Commit — `Single-column characteristics assignment on phone`.

---

### Task 14: Level, Languages, Titles — light conversions

**Files:** Modify `components/creator/steps/LevelSelectStep.tsx`, `wizard/LanguagesStep.tsx`, `wizard/TitlesStep.tsx`

- **Level:** single screen, `What level is this hero?`, `ChoiceRow` per level (or keep its grid if rows are already ≥44px single-column on phone).
- **Languages:** single screen, `Pick your languages`, helper with remaining count, `ChoiceRow` list with info peeks.
- **Titles:** optional — single screen with `onSkip={goNext}`, question `Add a title?`.

One commit — `Convert level, languages, and titles steps to phone screens`

---

### Task 15: PersonalStep + ReviewStep

**Files:** Modify `wizard/PersonalStep.tsx`, `wizard/ReviewStep.tsx`

- **Personal:** two screens — 1) `Who is this hero?` (name, pronouns, portrait), 2) `Tell their story` (backstory, appearance), both optional-feeling but Personal's existing completion rules unchanged. Inputs full-width, `h-11`.
- **Review:** single screen, phone-formatted: single-column summary list (reuse `CharacterSidebar`'s field logic conceptually — name/ancestry/culture/career/class/subclass/kit/stats), since the sidebar is hidden on phone this is the first full picture the user gets. Footer button already reads `Create Hero`.

Commit — `Phone-format the personal and review steps`

---

### Task 16: LevelUpStep phone formatting

**Files:** Modify `apps/vtt/src/components/creator/steps/LevelUpStep.tsx`

Keep one screen per level (as designed). Wrap in a single `DecisionScreen` (overline `Level up`, question `Choose your level ${lvl} features`); ensure choice targets are ≥44px single-column on phone. Commit — `Phone-format level-up steps`.

---

### Task 17: Full verification

**Step 1: Automated** — from the worktree root:
```bash
pnpm lint && pnpm build && pnpm --filter @anvil/data test:run
```
Expected: lint clean, build green, 3,765 tests pass (no logic was touched).

**Step 2: Phone walkthrough (390×844, device emulation with touch — `pointer: coarse` is part of the gate).** Dev server → `/app/heroes/new`. Create a **Conduit** end-to-end (the dense case: multiple skill sources, double subclass/domains, perk slots, ability slots):
- Header shows `Step X of 16`, progress bar advances, tapping opens the step sheet, jumping works.
- Every dense step shows one decision per screen with footer dots; Back walks sub-steps in reverse.
- Info buttons peek full rules text; Select inside a peek closes it.
- Complication and Titles show `Skip for now`.
- Review shows the full summary; `Create Hero` saves and lands on the hero page.
- Zero console errors throughout.

**Step 3: Desktop regression (1280×800, normal pointer).** Walk the same wizard: breadcrumb, two-pane selectors, sidebar, footer all render exactly as before this branch.

**Step 4:** Fix anything found (each fix: own commit). Then the branch is ready for PR to `staging` — use superpowers:finishing-a-development-branch.
