interface Props {
  current: number;
  total: number;
  labels: string[];
}

export function WizardProgress({ current, total, labels }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-zinc-800 px-6 py-3">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isDone
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-800 text-zinc-500'
              }`}
              title={labels[i]}
            >
              {step}
            </div>
            {step < total && <div className={`h-px w-3 ${isDone ? 'bg-zinc-600' : 'bg-zinc-800'}`} />}
          </div>
        );
      })}
    </div>
  );
}
