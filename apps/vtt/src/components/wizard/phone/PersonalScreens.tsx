import type { ChangeEvent } from 'react';
import { Input } from '@anvil/ui';
import { DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

interface BuildPersonalScreensArgs {
  name: string;
  pronouns: string;
  backstory: string;
  appearance: string;
  portraitUrl: string | null;
  /** Validation message from the step's portrait upload handler. */
  uploadError: string | null;
  onChangeName: (name: string) => void;
  onChangePronouns: (pronouns: string) => void;
  onChangeBackstory: (backstory: string) => void;
  onChangeAppearance: (appearance: string) => void;
  /** Desktop's file-input handler, reused verbatim (data URL preview). */
  onUploadPortrait: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPortrait: () => void;
}

const FIELD_LABEL = 'text-xs font-semibold uppercase tracking-wider text-creator-text-muted';
const TEXTAREA =
  'w-full rounded-lg border border-creator-border bg-creator-card px-3 py-2.5 text-sm text-creator-text placeholder:text-creator-text-muted';

/**
 * Two static screens: identity (name, pronouns, portrait) and story
 * (backstory, appearance). Screen ids are constant and every input sits at a
 * fixed position, so focus survives the store round-trip while typing.
 * Rendered by PhoneDecisionFlow on phone viewports only — desktop keeps
 * PersonalStep's original layout (including its portrait URL field, which
 * phone drops in favor of the upload picker).
 */
export function buildPersonalScreens({
  name,
  pronouns,
  backstory,
  appearance,
  portraitUrl,
  uploadError,
  onChangeName,
  onChangePronouns,
  onChangeBackstory,
  onChangeAppearance,
  onUploadPortrait,
  onClearPortrait,
}: BuildPersonalScreensArgs): DecisionScreenSpec[] {
  return [
    {
      id: 'personal-identity',
      render: () => (
        <DecisionScreen
          overline="Personal · 1 of 2"
          question="Who is this hero?"
          helper="Only the name is required."
        >
          <label className="flex flex-col gap-2">
            <span className={FIELD_LABEL}>Name</span>
            <Input
              className="min-h-11 w-full"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="Your hero's name"
            />
          </label>
          <label className="flex flex-col gap-2 pt-1">
            <span className={FIELD_LABEL}>Pronouns</span>
            <Input
              className="min-h-11 w-full"
              value={pronouns}
              onChange={(e) => onChangePronouns(e.target.value)}
              placeholder="e.g. they/them, she/her, he/him"
            />
          </label>
          <div className="flex flex-col gap-2 pt-1">
            <span className={FIELD_LABEL}>Portrait</span>
            <div className="flex items-center gap-3">
              {portraitUrl && (
                <img
                  src={portraitUrl}
                  alt="Hero portrait preview"
                  className="size-16 shrink-0 rounded-lg border border-creator-border object-cover"
                />
              )}
              <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-creator-border text-sm text-creator-text-muted">
                {portraitUrl ? 'Replace portrait' : 'Upload portrait'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={onUploadPortrait}
                />
              </label>
              {portraitUrl && (
                <button
                  type="button"
                  onClick={onClearPortrait}
                  className="min-h-11 shrink-0 rounded-lg px-3 text-sm text-creator-text-muted"
                >
                  Clear
                </button>
              )}
            </div>
            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
          </div>
        </DecisionScreen>
      ),
    },
    {
      id: 'personal-story',
      render: () => (
        <DecisionScreen
          overline="Personal · 2 of 2"
          question="Tell their story"
          helper="Optional — flesh them out now or later."
        >
          <label className="flex flex-col gap-2">
            <span className={FIELD_LABEL}>Backstory</span>
            <textarea
              className={TEXTAREA}
              rows={8}
              value={backstory}
              onChange={(e) => onChangeBackstory(e.target.value)}
              placeholder="Your hero's story..."
            />
          </label>
          <label className="flex flex-col gap-2 pt-1">
            <span className={FIELD_LABEL}>Appearance</span>
            <textarea
              className={TEXTAREA}
              rows={5}
              value={appearance}
              onChange={(e) => onChangeAppearance(e.target.value)}
              placeholder="What do they look like?"
            />
          </label>
        </DecisionScreen>
      ),
    },
  ];
}
