import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Patient, ToothSurface, TreatmentStatus } from '@/data/types';
import { repository } from '@/data';
import { useUsers } from '@/data/hooks';
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';

const SURFACE_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'Whole tooth (no specific surface)' },
  { value: 'M', label: 'Mesial' },
  { value: 'D', label: 'Distal' },
  { value: 'O', label: 'Occlusal' },
  { value: 'I', label: 'Incisal' },
  { value: 'L', label: 'Lingual' },
  { value: 'F', label: 'Facial' },
];

const STATUS_OPTIONS: TreatmentStatus[] = ['planned', 'in_progress', 'completed', 'cancelled', 'on_hold'];

const treatmentFormSchema = z.object({
  procedureCode: z.string().trim().min(1, 'Required').max(10),
  procedureName: z.string().trim().min(1, 'Required').max(255),
  surface: z.string(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled', 'on_hold']),
  diagnosis: z.string().trim().max(1000).optional(),
  estimatedCost: z.coerce.number().min(0, 'Must be 0 or more'),
  dentistId: z.string().min(1, 'Select a dentist'),
});

type TreatmentFormValues = z.infer<typeof treatmentFormSchema>;

interface NewTreatmentFormProps {
  patient: Patient;
  toothNumber: number;
  initialSurface: ToothSurface | null;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Two steps in one form, not two dialogs: fill in the clinical details,
 * then an explicit "Save to [Patient Name] (DOB ...)?" confirmation before
 * anything is written — the brief's requirement that a clinical write
 * names the patient, not just "Save?".
 */
export function NewTreatmentForm({ patient, toothNumber, initialSurface, onCancel, onSaved }: NewTreatmentFormProps) {
  const { data: users } = useUsers();
  const dentists = (users ?? []).filter((u) => u.role === 'dentist');
  const [pendingValues, setPendingValues] = useState<TreatmentFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentFormSchema),
    defaultValues: {
      procedureCode: '',
      procedureName: '',
      surface: initialSurface ?? 'none',
      status: 'planned',
      diagnosis: '',
      estimatedCost: 0,
      dentistId: '',
    },
  });

  // `dentists` isn't ready until useUsers() resolves, which happens after
  // this form's own defaultValues are already locked in — so the first
  // dentist is filled in here instead, once the list arrives, rather than
  // silently defaulting to an empty (and then validation-blocked) select.
  const currentDentistId = watch('dentistId');
  useEffect(() => {
    if (!currentDentistId && dentists.length > 0) {
      setValue('dentistId', dentists[0].id);
    }
  }, [dentists, currentDentistId, setValue]);

  const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');

  const handleConfirm = async (): Promise<void> => {
    if (!pendingValues) return;
    setIsSaving(true);
    await repository.createTreatment(
      {
        patientId: patient.id,
        appointmentId: null,
        procedureCode: pendingValues.procedureCode.toUpperCase(),
        procedureName: pendingValues.procedureName,
        toothNumber,
        surface: pendingValues.surface === 'none' ? null : (pendingValues.surface as ToothSurface),
        status: pendingValues.status,
        startedAt: null,
        completedAt: null,
        diagnosis: pendingValues.diagnosis || null,
        treatmentPlan: null,
        estimatedCost: pendingValues.estimatedCost,
        actualCost: null,
        dentistId: pendingValues.dentistId,
        hygienistId: null,
        followUpRequired: false,
        followUpDate: null,
      },
      pendingValues.dentistId,
    );
    setIsSaving(false);
    onSaved();
  };

  if (pendingValues) {
    return (
      <div className="mt-4">
        <p className="text-sm text-ink-primary">
          Save this treatment to <strong>{fullName}</strong> (DOB {patient.dateOfBirth})?
        </p>
        <p className="mt-2 rounded-md border border-hairline bg-surface-raised p-3 text-sm text-ink-secondary">
          {pendingValues.procedureName} ({pendingValues.procedureCode}) — Tooth {toothNumber}
          {pendingValues.surface !== 'none' ? `, ${pendingValues.surface} surface` : ''}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingValues(null)} disabled={isSaving}>
            Back to form
          </Button>
          <Button variant="primary" onClick={() => void handleConfirm()} disabled={isSaving}>
            {isSaving ? 'Saving…' : `Save to ${fullName}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={(event) => void handleSubmit(setPendingValues)(event)}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="procedureCode">CDT code</Label>
          <Input id="procedureCode" placeholder="D2140" invalid={!!errors.procedureCode} {...register('procedureCode')} />
          {errors.procedureCode ? <p className="mt-1 text-xs text-status-danger">{errors.procedureCode.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="procedureName">Procedure name</Label>
          <Input id="procedureName" placeholder="Amalgam filling" invalid={!!errors.procedureName} {...register('procedureName')} />
          {errors.procedureName ? <p className="mt-1 text-xs text-status-danger">{errors.procedureName.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="surface">Surface</Label>
          <Controller
            control={control}
            name="surface"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="surface" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SURFACE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dentistId">Dentist</Label>
        <Controller
          control={control}
          name="dentistId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="dentistId" className="mt-1">
                <SelectValue placeholder="Select a dentist" />
              </SelectTrigger>
              <SelectContent>
                {dentists.map((dentist) => (
                  <SelectItem key={dentist.id} value={dentist.id}>
                    {dentist.firstName} {dentist.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.dentistId ? <p className="mt-1 text-xs text-status-danger">{errors.dentistId.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="estimatedCost">Estimated cost (₱)</Label>
        <Input
          id="estimatedCost"
          type="number"
          min={0}
          step="1"
          invalid={!!errors.estimatedCost}
          {...register('estimatedCost')}
        />
        {errors.estimatedCost ? <p className="mt-1 text-xs text-status-danger">{errors.estimatedCost.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="diagnosis">Diagnosis (optional)</Label>
        <Input id="diagnosis" {...register('diagnosis')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Review and save</Button>
      </div>
    </form>
  );
}
