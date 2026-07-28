import { useState } from 'react';
import type { Patient, Treatment, ToothSurface } from '@/data/types';
import { TREATMENT_STATUS_LABEL } from '../odontogram/statusStyles';
import { NewTreatmentForm } from './NewTreatmentForm';
import { Dialog, DialogContent, DialogTitle, DialogDescription, Button } from '@/components/ui';

interface ToothDetailDialogProps {
  patient: Patient;
  toothNumber: number | null;
  initialSurface: ToothSurface | null;
  treatments: Treatment[];
  onClose: () => void;
  onTreatmentCreated: () => void;
}

export function ToothDetailDialog({
  patient,
  toothNumber,
  initialSurface,
  treatments,
  onClose,
  onTreatmentCreated,
}: ToothDetailDialogProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      setIsAdding(false);
      onClose();
    }
  };

  if (toothNumber === null) return null;

  const forThisTooth = treatments.filter((t) => t.toothNumber === toothNumber);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Tooth {toothNumber}</DialogTitle>
        <DialogDescription>
          {forThisTooth.length === 0
            ? 'No treatments recorded for this tooth yet.'
            : `${forThisTooth.length} recorded treatment${forThisTooth.length === 1 ? '' : 's'}.`}
        </DialogDescription>

        {!isAdding && (
          <>
            {forThisTooth.length > 0 ? (
              <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                {forThisTooth.map((t) => (
                  <li key={t.id} className="rounded-md border border-hairline p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-ink-secondary">{t.procedureCode}</span>
                      <span className="text-xs text-ink-secondary">{TREATMENT_STATUS_LABEL[t.status]}</span>
                    </div>
                    <p className="mt-1 font-medium text-ink-primary">{t.procedureName}</p>
                    {t.surface ? <p className="text-xs text-ink-secondary">Surface: {t.surface}</p> : null}
                    {t.diagnosis ? <p className="mt-1 text-xs text-ink-secondary">{t.diagnosis}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setIsAdding(true)}>
              Add treatment
            </Button>
          </>
        )}

        {isAdding && (
          <NewTreatmentForm
            patient={patient}
            toothNumber={toothNumber}
            initialSurface={initialSurface}
            onCancel={() => setIsAdding(false)}
            onSaved={() => {
              setIsAdding(false);
              onTreatmentCreated();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
