import type { SeededRandom } from '../prng';
import type {
  StaffUser,
  Patient,
  AppointmentType,
  Appointment,
  AppointmentStatus,
  ConfirmationMethod,
  ReminderType,
} from '@/data/types';
import {
  dateAtDayOffset,
  atTime,
  addMinutes,
  toIsoDateTime,
  isoWeekday,
} from '../referenceDate';
import { WORKING_ISO_WEEKDAYS, BUSINESS_HOURS_START_HOUR, BUSINESS_HOURS_END_HOUR } from '../locale/ph';
import { PATIENT_INDEX, APPOINTMENT_DAY } from '../coverageIndex';

interface Interval {
  start: number;
  end: number;
}

const TREATMENT_BEARING_TYPES = new Set(['Filling', 'Crown', 'Root Canal', 'Extraction']);
const CONFIRMATION_METHODS: ConfirmationMethod[] = ['sms', 'email', 'phone', 'in_person'];
const REMINDER_TYPES: ReminderType[] = ['sms', 'email', 'call'];

function typeByName(types: AppointmentType[], name: string): AppointmentType {
  const found = types.find((t) => t.name === name);
  if (!found) throw new Error(`Unknown appointment type: ${name}`);
  return found;
}

function statusForPastDay(rng: SeededRandom): AppointmentStatus {
  const roll = rng.next();
  if (roll < 0.72) return 'completed';
  if (roll < 0.82) return 'cancelled';
  if (roll < 0.92) return 'no_show';
  return 'rescheduled';
}

function statusForUpcomingDay(rng: SeededRandom): AppointmentStatus {
  return rng.bool(0.7) ? 'confirmed' : 'scheduled';
}

export function generateAppointments(
  rng: SeededRandom,
  clinicId: string,
  users: StaffUser[],
  patients: Patient[],
  appointmentTypes: AppointmentType[],
): Appointment[] {
  const dentists = users.filter((u) => u.role === 'dentist');
  const hygienists = users.filter((u) => u.role === 'hygienist');
  const providers = [...dentists, ...hygienists];
  const [dentistA, dentistB] = dentists;
  const [hygienistA, hygienistB] = hygienists;

  const busy = new Map<string, Interval[]>(providers.map((p) => [p.id, []]));
  const appointments: Appointment[] = [];

  const overlaps = (providerId: string, start: Date, end: Date): boolean => {
    const s = start.getTime();
    const e = end.getTime();
    return (busy.get(providerId) ?? []).some((iv) => s < iv.end && e > iv.start);
  };

  const book = (providerId: string, start: Date, end: Date): void => {
    busy.get(providerId)?.push({ start: start.getTime(), end: end.getTime() });
  };

  function place(opts: {
    patientId: string;
    providerId: string;
    typeName: string;
    dayOffset: number;
    startHour: number;
    startMinute?: number;
    status: AppointmentStatus;
    overrides?: Partial<Appointment>;
  }): Appointment {
    const type = typeByName(appointmentTypes, opts.typeName);
    const day = dateAtDayOffset(opts.dayOffset);
    const start = atTime(day, opts.startHour, opts.startMinute ?? 0);
    const end = addMinutes(start, type.durationMinutes);

    if (overlaps(opts.providerId, start, end)) {
      throw new Error(
        `Double-booking detected for provider ${opts.providerId} at ${toIsoDateTime(start)}`,
      );
    }
    book(opts.providerId, start, end);

    const wasConfirmed = opts.status === 'confirmed' || opts.status === 'completed';
    const bookingLeadMinutes =
      opts.typeName === 'Emergency' ? rng.int(30, 180) : rng.int(60 * 24, 60 * 24 * 30);

    const appointment: Appointment = {
      id: rng.id('appt'),
      clinicId,
      patientId: opts.patientId,
      providerId: opts.providerId,
      appointmentTypeId: type.id,
      startTime: toIsoDateTime(start),
      endTime: toIsoDateTime(end),
      status: opts.status,
      confirmedAt: wasConfirmed ? toIsoDateTime(addMinutes(start, -rng.int(60 * 24, 60 * 24 * 3))) : null,
      confirmationMethod: wasConfirmed ? rng.pick(CONFIRMATION_METHODS) : null,
      notes: null,
      treatmentPlanned: TREATMENT_BEARING_TYPES.has(opts.typeName),
      reminderSentAt:
        opts.typeName !== 'Emergency' && opts.status !== 'cancelled'
          ? toIsoDateTime(addMinutes(start, -60 * 24))
          : null,
      reminderType: opts.typeName !== 'Emergency' ? rng.pick(REMINDER_TYPES) : null,
      noShowReason: opts.status === 'no_show' ? 'Patient did not arrive or call ahead.' : null,
      rescheduledToAppointmentId: null,
      cancelledAt:
        opts.status === 'cancelled' ? toIsoDateTime(addMinutes(start, -rng.int(60, 2000))) : null,
      cancelReason:
        opts.status === 'cancelled' ? 'Patient requested reschedule due to a scheduling conflict.' : null,
      createdAt: toIsoDateTime(addMinutes(start, -bookingLeadMinutes)),
      ...opts.overrides,
    };

    appointments.push(appointment);
    return appointment;
  }

  const patientAt = (index: number): Patient => patients[index];

  // ===================================================================
  // Phase A — deliberate coverage-matrix cases, hand-placed by day/time
  // ===================================================================

  // Today: 6-9 appointments across both dentists, one a same-day emergency.
  place({ patientId: patientAt(36).id, providerId: dentistA.id, typeName: 'Cleaning', dayOffset: APPOINTMENT_DAY.today, startHour: 9, status: 'confirmed' });
  place({ patientId: patientAt(37).id, providerId: dentistA.id, typeName: 'Filling', dayOffset: APPOINTMENT_DAY.today, startHour: 10, status: 'confirmed' });
  place({ patientId: patientAt(38).id, providerId: dentistA.id, typeName: 'Exam', dayOffset: APPOINTMENT_DAY.today, startHour: 13, status: 'confirmed' });
  place({ patientId: patientAt(39).id, providerId: dentistA.id, typeName: 'Cleaning', dayOffset: APPOINTMENT_DAY.today, startHour: 15, status: 'confirmed' });
  place({ patientId: patientAt(40).id, providerId: dentistB.id, typeName: 'Exam', dayOffset: APPOINTMENT_DAY.today, startHour: 9, startMinute: 30, status: 'confirmed' });
  place({ patientId: patientAt(41).id, providerId: dentistB.id, typeName: 'Filling', dayOffset: APPOINTMENT_DAY.today, startHour: 11, status: 'confirmed' });
  place({
    patientId: patientAt(43).id,
    providerId: dentistB.id,
    typeName: 'Emergency',
    dayOffset: APPOINTMENT_DAY.today,
    startHour: 14,
    status: 'scheduled',
  });

  // Fully-booked day: dentist A packed back-to-back, zero gaps, from open to near-close.
  {
    const cycle = ['Cleaning', 'Exam', 'Filling'];
    const totalOpenMinutes = (BUSINESS_HOURS_END_HOUR - BUSINESS_HOURS_START_HOUR) * 60;
    let cursorMinutes = 0;
    let cycleIndex = 0;
    let patientCursor = 0;
    const rotation = [44, 45, 46, 47, 25, 27, 28, 29, 31, 32, 33, 34, 35, 44, 45, 46, 47, 25];
    for (;;) {
      const typeName = cycle[cycleIndex % cycle.length];
      const type = typeByName(appointmentTypes, typeName);
      if (cursorMinutes + type.durationMinutes > totalOpenMinutes) break;
      const startHour = BUSINESS_HOURS_START_HOUR + Math.floor(cursorMinutes / 60);
      const startMinute = cursorMinutes % 60;
      place({
        patientId: patientAt(rotation[patientCursor % rotation.length]).id,
        providerId: dentistA.id,
        typeName,
        dayOffset: APPOINTMENT_DAY.fullyBookedDay,
        startHour,
        startMinute,
        status: rng.bool(0.9) ? 'completed' : 'no_show',
      });
      cursorMinutes += type.durationMinutes;
      cycleIndex += 1;
      patientCursor += 1;
    }
  }

  // A cancelled and a no-show appointment on the same past day.
  place({ patientId: patientAt(44).id, providerId: dentistB.id, typeName: 'Cleaning', dayOffset: APPOINTMENT_DAY.cancelledAndNoShowDay, startHour: 10, status: 'cancelled' });
  place({ patientId: patientAt(45).id, providerId: dentistB.id, typeName: 'Exam', dayOffset: APPOINTMENT_DAY.cancelledAndNoShowDay, startHour: 11, status: 'no_show' });

  // A 90-minute Root Canal spanning what would be a lunch break.
  place({ patientId: patientAt(46).id, providerId: dentistA.id, typeName: 'Root Canal', dayOffset: APPOINTMENT_DAY.longRootCanalDay, startHour: 12, status: 'completed' });

  // An unconfirmed appointment 2 days out — no reminder sent yet.
  place({
    patientId: patientAt(47).id,
    providerId: hygienistA.id,
    typeName: 'Exam',
    dayOffset: APPOINTMENT_DAY.unconfirmedUpcoming,
    startHour: 10,
    status: 'scheduled',
    overrides: { confirmedAt: null, confirmationMethod: null, reminderSentAt: null },
  });

  // Patient with 4 historical no-shows.
  APPOINTMENT_DAY.fourNoShowDays.forEach((dayOffset, i) => {
    place({
      patientId: patientAt(PATIENT_INDEX.fourNoShows).id,
      providerId: i % 2 === 0 ? hygienistA.id : hygienistB.id,
      typeName: 'Cleaning',
      dayOffset,
      startHour: 9,
      status: 'no_show',
    });
  });

  // Patient with treatments on 15+ teeth — six separate completed visits.
  APPOINTMENT_DAY.fifteenTeethVisits.forEach((dayOffset, i) => {
    place({
      patientId: patientAt(PATIENT_INDEX.fifteenPlusTeeth).id,
      providerId: i % 2 === 0 ? dentistA.id : dentistB.id,
      typeName: 'Filling',
      dayOffset,
      startHour: 9,
      status: 'completed',
    });
  });

  // Patient with 3 open invoices — three separate completed visits.
  APPOINTMENT_DAY.threeOpenInvoiceVisits.forEach((dayOffset) => {
    place({
      patientId: patientAt(PATIENT_INDEX.threeOpenInvoices).id,
      providerId: dentistA.id,
      typeName: 'Filling',
      dayOffset,
      startHour: 11,
      status: 'completed',
    });
  });

  // Patient whose invoice gets 8+ line items — two completed visits (invoice padded with fee lines).
  APPOINTMENT_DAY.eightLineItemVisits.forEach((dayOffset) => {
    place({
      patientId: patientAt(PATIENT_INDEX.eightLineItemInvoice).id,
      providerId: dentistB.id,
      typeName: 'Filling',
      dayOffset,
      startHour: 13,
      status: 'completed',
    });
  });

  // Two appointments deliberately outside the -90..+30 window: the invoice
  // aging spread needs 61-90 and 90+ day overdue buckets, which the
  // ~220-appointment window (max ~90 days back) can't reach on its own.
  // Not counted toward the ~220 volume target.
  place({ patientId: patientAt(5).id, providerId: dentistA.id, typeName: 'Filling', dayOffset: APPOINTMENT_DAY.agingBucket61to90VisitDay, startHour: 10, status: 'completed' });
  place({ patientId: patientAt(6).id, providerId: dentistB.id, typeName: 'Crown', dayOffset: APPOINTMENT_DAY.agingBucket90PlusVisitDay, startHour: 10, status: 'completed' });

  // ===================================================================
  // Phase B — general filler toward the ~220 target, days/providers not
  // already spoken for by Phase A. Day 0 and the empty-future-day are
  // hard-blocked so those two coverage rows stay exact.
  // ===================================================================
  const WEIGHTED_TYPE_NAMES = [
    'Cleaning', 'Cleaning', 'Cleaning',
    'Exam', 'Exam',
    'Filling', 'Filling',
    'Crown', 'Extraction', 'Consultation', 'Root Canal', 'Emergency',
  ];
  // Excluded so their invoice histories stay exactly what Phase A built —
  // zeroTreatments must stay at zero, and the other two need an exact
  // count (3 open invoices, one 8+ line item invoice) that an incidental
  // filler visit would silently pad past.
  const excludedFromFiller: number[] = [
    PATIENT_INDEX.zeroTreatments,
    PATIENT_INDEX.threeOpenInvoices,
    PATIENT_INDEX.eightLineItemInvoice,
  ];
  const fillerPatients = patients.filter((_, i) => !excludedFromFiller.includes(i));
  const totalOpenMinutes = (BUSINESS_HOURS_END_HOUR - BUSINESS_HOURS_START_HOUR) * 60;

  for (let dayOffset = -90; dayOffset <= 30; dayOffset += 1) {
    if (dayOffset === APPOINTMENT_DAY.today || dayOffset === APPOINTMENT_DAY.emptyFutureDay) continue;
    const day = dateAtDayOffset(dayOffset);
    if (!WORKING_ISO_WEEKDAYS.includes(isoWeekday(day))) continue;

    for (const provider of providers) {
      const attempts = rng.bool(0.38) ? (rng.bool(0.1) ? 2 : 1) : 0;
      for (let a = 0; a < attempts; a += 1) {
        const typeName = rng.pick(WEIGHTED_TYPE_NAMES);
        const type = typeByName(appointmentTypes, typeName);
        if (type.durationMinutes > totalOpenMinutes) continue;

        const startMinuteOffset = rng.int(0, totalOpenMinutes - type.durationMinutes + 1);
        const startHour = BUSINESS_HOURS_START_HOUR + Math.floor(startMinuteOffset / 60);
        const startMinute = startMinuteOffset % 60;
        const start = atTime(day, startHour, startMinute);
        const end = addMinutes(start, type.durationMinutes);

        if (overlaps(provider.id, start, end)) continue;

        place({
          patientId: rng.pick(fillerPatients).id,
          providerId: provider.id,
          typeName,
          dayOffset,
          startHour,
          startMinute,
          status: dayOffset < 0 ? statusForPastDay(rng) : statusForUpcomingDay(rng),
        });
      }
    }
  }

  return appointments;
}
