import { useState, useCallback } from 'react';
import { Plus, Minus, Trash2, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@anvil/ui';
import { MontageLogic } from '@anvil/data';
import type { MontageTestRecord, UpdateMontageTestInput } from '@anvil/types';

export interface MontageTestTrackerProps {
  test: MontageTestRecord;
  onUpdate: (input: UpdateMontageTestInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function MontageTestTracker({
  test,
  onUpdate,
  onDelete,
}: MontageTestTrackerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Compute outcome from current state
  const outcome = MontageLogic.calculateOutcome(
    test.successes,
    test.failures,
    test.targetSuccesses,
    test.maxFailures,
  );

  const outcomeLabel = MontageLogic.getOutcomeDescription(outcome);
  const isComplete = MontageLogic.isMontageComplete(outcome);

  const handleAddSuccess = useCallback(() => {
    const newSuccesses = test.successes + 1;
    const newOutcome = MontageLogic.calculateOutcome(
      newSuccesses,
      test.failures,
      test.targetSuccesses,
      test.maxFailures,
    );
    const input: UpdateMontageTestInput = {
      successes: newSuccesses,
    };
    if (MontageLogic.isMontageComplete(newOutcome)) {
      input.status = newOutcome === 'total_failure' ? 'failed' : 'succeeded';
    }
    onUpdate(input);
  }, [test, onUpdate]);

  const handleAddFailure = useCallback(() => {
    const newFailures = test.failures + 1;
    const newOutcome = MontageLogic.calculateOutcome(
      test.successes,
      newFailures,
      test.targetSuccesses,
      test.maxFailures,
    );
    const input: UpdateMontageTestInput = {
      failures: newFailures,
    };
    if (MontageLogic.isMontageComplete(newOutcome)) {
      input.status = newOutcome === 'total_failure' ? 'failed' : 'succeeded';
    }
    onUpdate(input);
  }, [test, onUpdate]);

  const handleRemoveSuccess = useCallback(() => {
    if (test.successes <= 0) return;
    onUpdate({ successes: test.successes - 1, status: 'in_progress' });
  }, [test, onUpdate]);

  const handleRemoveFailure = useCallback(() => {
    if (test.failures <= 0) return;
    onUpdate({ failures: test.failures - 1, status: 'in_progress' });
  }, [test, onUpdate]);

  // Status badge color
  const statusBadge = (() => {
    switch (outcome) {
      case 'total_success':
        return (
          <Badge className="border-transparent bg-green-600/20 text-[9px] px-1 py-0 text-green-400">
            Success!
          </Badge>
        );
      case 'partial_success':
        return (
          <Badge className="border-transparent bg-amber-600/20 text-[9px] px-1 py-0 text-amber-400">
            Partial Success
          </Badge>
        );
      case 'total_failure':
        return (
          <Badge className="border-transparent bg-red-600/20 text-[9px] px-1 py-0 text-red-400">
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="border-transparent bg-blue-600/20 text-[9px] px-1 py-0 text-blue-400">
            In Progress
          </Badge>
        );
    }
  })();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="truncate text-xs font-bold">
              {test.testName}
            </CardTitle>
            {statusBadge}
          </div>
        </div>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="size-6 p-0 text-red-400 hover:text-red-300"
              onClick={onDelete}
            >
              <Check className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-6 p-0"
              onClick={() => setConfirmDelete(false)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0 text-zinc-500 hover:text-red-400"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3 px-3 pb-3 pt-0">
        {/* Success counter */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-medium text-green-400">Successes</span>
            <span className="text-[10px] text-zinc-500">
              {test.successes} / {test.targetSuccesses}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Circles */}
            <div className="flex flex-1 gap-1">
              {Array.from({ length: test.targetSuccesses }, (_, i) => (
                <div
                  key={i}
                  className={`size-4 rounded-full border ${
                    i < test.successes
                      ? 'border-green-500 bg-green-500'
                      : 'border-zinc-700 bg-zinc-900'
                  }`}
                />
              ))}
            </div>
            {/* +/- buttons */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="sm"
                className="size-5 p-0"
                onClick={handleRemoveSuccess}
                disabled={test.successes <= 0 || isComplete}
              >
                <Minus className="size-2.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="size-5 p-0"
                onClick={handleAddSuccess}
                disabled={isComplete}
              >
                <Plus className="size-2.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Failure counter */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-medium text-red-400">Failures</span>
            <span className="text-[10px] text-zinc-500">
              {test.failures} / {test.maxFailures}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Circles */}
            <div className="flex flex-1 gap-1">
              {Array.from({ length: test.maxFailures }, (_, i) => (
                <div
                  key={i}
                  className={`size-4 rounded-full border ${
                    i < test.failures
                      ? 'border-red-500 bg-red-500'
                      : 'border-zinc-700 bg-zinc-900'
                  }`}
                />
              ))}
            </div>
            {/* +/- buttons */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="sm"
                className="size-5 p-0"
                onClick={handleRemoveFailure}
                disabled={test.failures <= 0 || isComplete}
              >
                <Minus className="size-2.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="size-5 p-0"
                onClick={handleAddFailure}
                disabled={isComplete}
              >
                <Plus className="size-2.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Remaining info when in progress */}
        {!isComplete && (
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>
              {MontageLogic.getRemainingSuccesses(test.successes, test.targetSuccesses)} successes
              needed
            </span>
            <span>
              {MontageLogic.getRemainingFailures(test.failures, test.maxFailures)} failures
              remaining
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
