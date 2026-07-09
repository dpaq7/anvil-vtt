import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { D20Icon, cn } from '@anvil/ui';
import type { FirstStepTask } from './firstSteps.js';

interface FirstStepsChecklistProps {
  tasks: FirstStepTask[];
  dismissed: boolean;
  onDismiss: () => void;
}

/**
 * Goal-oriented first-steps card shown above the dashboard stats until every
 * task completes (derived from live data) or the user dismisses it.
 * Auto-collapses to a slim progress pill once there's partial progress.
 */
export function FirstStepsChecklist({ tasks, dismissed, onDismiss }: FirstStepsChecklistProps) {
  const doneCount = tasks.filter((task) => task.done).length;
  const allDone = doneCount === tasks.length;
  const [expanded, setExpanded] = useState(doneCount === 0);

  if (dismissed || allDone || tasks.length === 0) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        data-onboarding="first-steps"
        className="flex w-fit items-center gap-2.5 rounded-chip border border-zinc-800/75 bg-zinc-950/65 px-4 py-2 text-sm font-medium text-zinc-200 shadow-sm shadow-black/20 backdrop-blur-sm transition-colors hover:border-zinc-700"
      >
        <D20Icon size={16} className="text-anvil-ember-400" aria-hidden="true" />
        First steps: {doneCount} of {tasks.length} done
        <ChevronDown size={14} className="text-zinc-500" aria-hidden="true" />
      </button>
    );
  }

  return (
    <section
      aria-label="First steps"
      data-onboarding="first-steps"
      className="rounded-card border border-zinc-800/75 bg-zinc-950/70 p-4 shadow-lg shadow-black/20 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-chip bg-anvil-ember-400/15 text-anvil-ember-400">
            <D20Icon size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-100">First steps</h2>
            <p className="text-xs text-zinc-500">
              {doneCount} of {tasks.length} done — finish these and you’re table-ready.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {doneCount > 0 && (
            <button
              type="button"
              aria-label="Collapse first steps"
              onClick={() => setExpanded(false)}
              className="flex size-8 items-center justify-center rounded-chip text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <ChevronUp size={15} />
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss first steps"
            onClick={onDismiss}
            className="flex size-8 items-center justify-center rounded-chip text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2',
              task.done
                ? 'border-transparent bg-zinc-900/40'
                : 'border-zinc-800/75 bg-zinc-950/50',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border',
                task.done
                  ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                  : 'border-zinc-700 text-transparent',
              )}
            >
              <Check size={12} strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  task.done ? 'text-zinc-500 line-through' : 'text-zinc-200',
                )}
              >
                {task.label}
              </p>
              {!task.done && <p className="text-xs text-zinc-500">{task.detail}</p>}
            </div>
            {!task.done && (
              <Link
                to={task.to}
                className="inline-flex shrink-0 items-center gap-1 rounded-chip border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                <task.icon size={12} aria-hidden="true" />
                {task.cta}
                <ArrowRight size={11} aria-hidden="true" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
