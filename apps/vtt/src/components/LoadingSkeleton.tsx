import { cn } from '@anvil/ui';

interface LoadingSkeletonProps {
  variant?: 'page' | 'card' | 'list' | 'canvas';
  className?: string;
}

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-zinc-800', className)} />
  );
}

function PageSkeleton() {
  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Left rail */}
      <div className="flex w-64 flex-col gap-3 border-r border-zinc-800 p-4">
        <Bone className="h-4 w-24" />
        <Bone className="h-8 w-full" />
        <Bone className="h-8 w-full" />
        <Bone className="h-8 w-full" />
      </div>
      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex h-12 items-center border-b border-zinc-800 px-4">
          <Bone className="h-4 w-32" />
        </div>
        {/* Stage area */}
        <div className="flex flex-1 items-center justify-center p-8">
          <Bone className="h-64 w-full max-w-2xl rounded-lg" />
        </div>
        {/* Film strip */}
        <div className="flex h-16 items-center gap-2 border-t border-zinc-800 px-4">
          <Bone className="h-10 w-16 rounded" />
          <Bone className="h-10 w-16 rounded" />
          <Bone className="h-10 w-16 rounded" />
        </div>
      </div>
      {/* Right rail */}
      <div className="flex w-64 flex-col gap-3 border-l border-zinc-800 p-4">
        <Bone className="h-4 w-20" />
        <Bone className="h-24 w-full rounded" />
        <Bone className="h-4 w-20" />
        <Bone className="h-16 w-full rounded" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded border border-zinc-800 p-4">
      <Bone className="h-4 w-2/3" />
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-4/5" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Bone className="h-6 w-6 rounded-full" />
          <Bone className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        <p className="text-xs text-zinc-500">Loading map...</p>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ variant = 'page', className }: LoadingSkeletonProps) {
  const content = (() => {
    switch (variant) {
      case 'page': return <PageSkeleton />;
      case 'card': return <CardSkeleton />;
      case 'list': return <ListSkeleton />;
      case 'canvas': return <CanvasSkeleton />;
    }
  })();

  return <div className={className}>{content}</div>;
}
