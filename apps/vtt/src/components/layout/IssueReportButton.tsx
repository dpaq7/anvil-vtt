import { useState, type FormEvent } from 'react';
import { useLocation, type Location } from 'react-router-dom';
import { AlertTriangle, Bug, CheckCircle2, Send } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Input,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
  useSidebar,
} from '@anvil/ui';
import { addBreadcrumb, reportBug } from '../../lib/bug-reporting.js';
import { useAuthStore } from '../../stores/authStore.js';

type ReportStatus =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'sent'; id: string | null }
  | { state: 'failed'; message: string };

function reportRoute(location: Location) {
  return `${location.pathname}${location.search ? '?[redacted]' : ''}${location.hash ? '#[redacted]' : ''}`;
}

export function IssueReportButton() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<ReportStatus>({ state: 'idle' });
  const detailsTrimmed = details.trim();
  const disabled = status.state === 'sending' || detailsTrimmed.length === 0;

  const reset = () => {
    setSummary('');
    setDetails('');
    setStatus({ state: 'idle' });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      addBreadcrumb({
        category: 'ui',
        message: 'Opened issue report dialog',
        data: { route: reportRoute(location), role: user?.role ?? null },
      });
    } else {
      reset();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    const summaryTrimmed = summary.trim();
    const reportMessage = summaryTrimmed || detailsTrimmed.slice(0, 160);

    addBreadcrumb({
      category: 'manual-report',
      message: 'Issue report submitted',
      data: {
        route: reportRoute(location),
        role: user?.role ?? null,
      },
    });

    setStatus({ state: 'sending' });
    try {
      const result = await reportBug({
        kind: 'manual-report',
        message: reportMessage,
        source: 'issue-report-dialog',
        context: {
          summary: summaryTrimmed || null,
          details: detailsTrimmed,
          route: reportRoute(location),
          role: user?.role ?? null,
        },
      });

      setStatus({ state: 'sent', id: result?.id ?? null });
      setSummary('');
      setDetails('');
    } catch (error) {
      setStatus({
        state: 'failed',
        message: error instanceof Error ? error.message : 'Issue report failed',
      });
    }
  };

  const triggerButton = (
    <button
      type="button"
      aria-label="Report issue"
      data-onboarding="menu-report-issue"
      className={cn(
        'mx-1 mb-1 flex h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-anvil-ink/80 transition-colors hover:bg-black/10 hover:text-anvil-ink',
        collapsed ? 'w-10 justify-center px-0' : 'w-[calc(100%-0.5rem)] justify-start',
      )}
    >
      <Bug size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">Report issue</span>}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">Report issue</TooltipContent>}
      </Tooltip>

      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-base">
          <Bug className="size-4 text-cyan-300" />
          Report Issue
        </DialogTitle>

        <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Summary</span>
            <Input
              value={summary}
              onChange={(event) => {
                setSummary(event.target.value);
                setStatus({ state: 'idle' });
              }}
              placeholder="Short title"
              maxLength={160}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">What happened?</span>
            <Textarea
              value={details}
              onChange={(event) => {
                setDetails(event.target.value);
                setStatus({ state: 'idle' });
              }}
              placeholder="Describe what looked wrong, crashed, or felt out of sync."
              className="min-h-36"
              maxLength={2000}
              required
            />
          </label>

          {status.state === 'sent' ? (
            <div className="flex items-start gap-2 rounded-md border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
              <span>{status.id ? `Report sent: ${status.id}` : 'Report sent.'}</span>
            </div>
          ) : null}

          {status.state === 'failed' ? (
            <div className="flex items-start gap-2 rounded-md border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
              <span>{status.message}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={disabled} className="gap-2">
              <Send className="size-4" />
              {status.state === 'sending' ? 'Sending...' : 'Send Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
