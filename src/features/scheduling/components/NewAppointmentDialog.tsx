import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Appointment } from '@/data/types';
import { repository } from '@/data';
import { usePatients, useUsers, useAppointmentTypes, useAppointments } from '@/data/hooks';
import { atTime, addMinutes, toIsoDateTime, toIsoDate, dateAtDayOffset } from '@/data/demoClock';
import { generateSlotOptions, formatSlotLabel } from '../utils/schedulingTime';
import { PatientPicker } from './PatientPicker';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';

const CLINICAL_ROLES = new Set(['dentist', 'hygienist']);

const appointmentFormSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  providerId: z.string().min(1, 'Select a provider'),
  appointmentTypeId: z.string().min(1, 'Select an appointment type'),
  date: z.string().min(1, 'Select a date'),
  startMinutes: z.coerce.number().int(),
  notes: z.string().trim().max(2000).optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialProviderId?: string;
  initialStartMinutes?: number;
  onCreated?: (appointment: Appointment) => void;
}

/**
 * Booking form: patient (searchable picker), provider, appointment type
 * (determines duration), date, and a slot picker limited to what actually
 * fits in business hours for that duration. Soft-warns (does not hard
 * block beyond disabling submit) on a same-provider overlap, since a real
 * receptionist workflow sometimes double-books on purpose (e.g. an
 * emergency slotted in) but should never do so blindly.
 */
export function NewAppointmentDialog({
  open,
  onOpenChange,
  initialDate,
  initialProviderId,
  initialStartMinutes,
  onCreated,
}: NewAppointmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {open ? (
          <NewAppointmentForm
            key={`${initialProviderId ?? ''}-${initialStartMinutes ?? ''}-${initialDate ? toIsoDate(initialDate) : ''}`}
            initialDate={initialDate}
            initialProviderId={initialProviderId}
            initialStartMinutes={initialStartMinutes}
            onCancel={() => onOpenChange(false)}
            onCreated={(appointment) => {
              onOpenChange(false);
              onCreated?.(appointment);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface NewAppointmentFormProps {
  initialDate?: Date;
  initialProviderId?: string;
  initialStartMinutes?: number;
  onCancel: () => void;
  onCreated: (appointment: Appointment) => void;
}

function NewAppointmentForm({
  initialDate,
  initialProviderId,
  initialStartMinutes,
  onCancel,
  onCreated,
}: NewAppointmentFormProps) {
  const { data: patients } = usePatients();
  const { data: users } = useUsers();
  const { data: appointmentTypes } = useAppointmentTypes();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const providers = (users ?? []).filter((u) => CLINICAL_ROLES.has(u.role));

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: '',
      providerId: initialProviderId ?? '',
      appointmentTypeId: '',
      date: toIsoDate(initialDate ?? dateAtDayOffset(0)),
      startMinutes: initialStartMinutes ?? 540,
      notes: '',
    },
  });

  const patientId = watch('patientId');
  const providerId = watch('providerId');
  const appointmentTypeId = watch('appointmentTypeId');
  const date = watch('date');
  const startMinutes = watch('startMinutes');

  const selectedType = appointmentTypes?.find((t) => t.id === appointmentTypeId);
  const durationMinutes = selectedType?.durationMinutes ?? 30;
  const slotOptions = useMemo(() => generateSlotOptions(durationMinutes), [durationMinutes]);

  const dayStart = date ? new Date(`${date}T00:00:00Z`) : dateAtDayOffset(0);
  const dayRange = { start: toIsoDateTime(atTime(dayStart, 8, 0)), end: toIsoDateTime(atTime(dayStart, 19, 0)) };
  const { data: dayAppointments } = useAppointments(dayRange, { providerId: providerId || undefined });

  const candidateStart = atTime(dayStart, Math.floor(startMinutes / 60), startMinutes % 60);
  const candidateEnd = addMinutes(candidateStart, durationMinutes);
  const conflict = (dayAppointments ?? []).find((a) => {
    if (a.status === 'cancelled' || a.status === 'no_show') return false;
    return new Date(a.startTime) < candidateEnd && new Date(a.endTime) > candidateStart;
  });

  const selectedPatient = patients?.find((p) => p.id === patientId);
  const patientName = selectedPatient
    ? [selectedPatient.firstName, selectedPatient.middleName, selectedPatient.lastName].filter(Boolean).join(' ')
    : null;

  async function handleSave(values: AppointmentFormValues): Promise<void> {
    setSaveError(null);
    setIsSaving(true);
    try {
      const start = atTime(new Date(`${values.date}T00:00:00Z`), Math.floor(values.startMinutes / 60), values.startMinutes % 60);
      const end = addMinutes(start, durationMinutes);
      const created = await repository.createAppointment(
        {
          patientId: values.patientId,
          providerId: values.providerId,
          appointmentTypeId: values.appointmentTypeId,
          startTime: toIsoDateTime(start),
          endTime: toIsoDateTime(end),
          status: 'scheduled',
          confirmationMethod: null,
          notes: values.notes || null,
          treatmentPlanned: false,
          reminderSentAt: null,
          reminderType: null,
        },
        values.providerId,
      );
      onCreated(created);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not book this appointment.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(handleSave)(e)}>
      <DialogTitle>New appointment</DialogTitle>
      <DialogDescription>Book a visit for a patient with an available provider.</DialogDescription>

      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="patientId">Patient</Label>
          <Controller
            control={control}
            name="patientId"
            render={({ field }) => (
              <PatientPicker
                id="patientId"
                patients={patients ?? []}
                value={field.value || null}
                onChange={field.onChange}
                invalid={!!errors.patientId}
              />
            )}
          />
          {errors.patientId ? <p className="mt-1 text-xs text-status-danger">{errors.patientId.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="providerId">Provider</Label>
            <Controller
              control={control}
              name="providerId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="providerId" className="mt-1">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.firstName} {provider.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.providerId ? <p className="mt-1 text-xs text-status-danger">{errors.providerId.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="appointmentTypeId">Type</Label>
            <Controller
              control={control}
              name="appointmentTypeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="appointmentTypeId" className="mt-1">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(appointmentTypes ?? []).map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: type.colorHex }}
                            aria-hidden
                          />
                          {type.name} ({type.durationMinutes}m)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.appointmentTypeId ? (
              <p className="mt-1 text-xs text-status-danger">{errors.appointmentTypeId.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="date">Date</Label>
            <input
              id="date"
              type="date"
              className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-base px-3 text-sm text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register('date')}
            />
          </div>
          <div>
            <Label htmlFor="startMinutes">Time</Label>
            <Controller
              control={control}
              name="startMinutes"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger id="startMinutes" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {slotOptions.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {formatSlotLabel(minutes)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            rows={2}
            className="mt-1 w-full rounded-md border border-hairline bg-surface-base px-3 py-2 text-sm text-ink-primary placeholder:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register('notes')}
          />
        </div>

        {conflict ? (
          <p className="rounded-md border border-status-warning bg-status-warning/10 px-3 py-2 text-xs text-status-warning">
            This overlaps with another appointment for this provider at {formatSlotLabel(
              Math.floor((new Date(conflict.startTime).getTime() - atTime(dayStart, 0, 0).getTime()) / 60_000),
            )}
            . You can still book it, but double-check with the provider first.
          </p>
        ) : null}
        {saveError ? <p className="text-xs text-status-danger">{saveError}</p> : null}
      </div>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Booking…' : patientName ? `Book for ${patientName}` : 'Book appointment'}
        </Button>
      </DialogFooter>
    </form>
  );
}
