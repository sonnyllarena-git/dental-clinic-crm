import type { SeededRandom } from '../prng';
import type {
  StaffUser,
  Patient,
  Appointment,
  AppointmentType,
  Treatment,
  ToothSurface,
} from '@/data/types';
import { CDT_PROCEDURES, procedureByCode, type CdtProcedureDef } from '../pools/cdtProcedures';
import { generateDiagnosis, generateTreatmentPlanText } from '../pools/clinicalText';
import { toIsoDateTime, dateAtDayOffset, toIsoDate } from '../referenceDate';
import { PATIENT_INDEX, APPOINTMENT_DAY } from '../coverageIndex';

const FALLBACK_CODE = 'D0120'; // used for Consultation/Emergency visits with no direct CDT mapping
const SURFACES: ToothSurface[] = ['M', 'D', 'O', 'I', 'L', 'F'];

function proceduresForType(typeName: string): CdtProcedureDef[] {
  const matches = CDT_PROCEDURES.filter((p) => p.appointmentTypeName === typeName);
  return matches.length > 0 ? matches : [procedureByCode(FALLBACK_CODE)];
}

function randomTooth(rng: SeededRandom, exclude: Set<number> = new Set()): number {
  let tooth = rng.int(1, 33);
  let guard = 0;
  while (exclude.has(tooth) && guard < 50) {
    tooth = rng.int(1, 33);
    guard += 1;
  }
  return tooth;
}

export function generateTreatments(
  rng: SeededRandom,
  clinicId: string,
  patients: Patient[],
  appointments: Appointment[],
  appointmentTypes: AppointmentType[],
  users: StaffUser[],
): Treatment[] {
  const typeNameById = new Map(appointmentTypes.map((t) => [t.id, t.name]));
  const dentists = users.filter((u) => u.role === 'dentist');
  const hygienistIds = new Set(users.filter((u) => u.role === 'hygienist').map((u) => u.id));
  const treatments: Treatment[] = [];
  const treatedAppointmentIds = new Set<string>();

  const makeTreatment = (opts: {
    patientId: string;
    appointment: Appointment | null;
    code: string;
    toothNumber: number | null;
    surface: ToothSurface | null;
    status: Treatment['status'];
    overrides?: Partial<Treatment>;
  }): Treatment => {
    const procedure = procedureByCode(opts.code);
    const performedByHygienist = opts.appointment ? hygienistIds.has(opts.appointment.providerId) : false;
    const dentistId = performedByHygienist
      ? rng.pick(dentists).id
      : (opts.appointment?.providerId ?? rng.pick(dentists).id);
    const hygienistId = performedByHygienist ? (opts.appointment?.providerId ?? null) : null;

    const isCompleted = opts.status === 'completed';
    const costVariance = rng.float(0.9, 1.1);

    if (opts.appointment) treatedAppointmentIds.add(opts.appointment.id);

    const treatment: Treatment = {
      id: rng.id('tx'),
      clinicId,
      patientId: opts.patientId,
      appointmentId: opts.appointment?.id ?? null,
      procedureCode: procedure.code,
      procedureName: procedure.name,
      toothNumber: opts.toothNumber,
      surface: opts.surface,
      status: opts.status,
      startedAt: isCompleted && opts.appointment ? opts.appointment.startTime : null,
      completedAt: isCompleted && opts.appointment ? opts.appointment.endTime : null,
      diagnosis: generateDiagnosis(rng),
      treatmentPlan: generateTreatmentPlanText(rng),
      estimatedCost: Math.round(procedure.typicalCost * costVariance),
      actualCost: isCompleted ? Math.round(procedure.typicalCost * costVariance) : null,
      dentistId,
      hygienistId,
      followUpRequired: false,
      followUpDate: null,
      createdAt: opts.appointment ? opts.appointment.createdAt : toIsoDateTime(dateAtDayOffset(-30)),
      ...opts.overrides,
    };

    treatments.push(treatment);
    return treatment;
  };

  // ===================================================================
  // Fifteen-plus-teeth patient: one same-tooth/3-surface visit, then five
  // visits with three distinct new teeth each — guarantees 15+ distinct
  // teeth without leaving it to chance.
  // ===================================================================
  {
    const patientId = patients[PATIENT_INDEX.fifteenPlusTeeth].id;
    const visits = appointments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const seenTeeth = new Set<number>();
    visits.forEach((appointment, visitIndex) => {
      if (visitIndex === 0) {
        const tooth = 14;
        seenTeeth.add(tooth);
        (['M', 'D', 'O'] as ToothSurface[]).forEach((surface) => {
          makeTreatment({ patientId, appointment, code: 'D2391', toothNumber: tooth, surface, status: 'completed' });
        });
        return;
      }
      for (let i = 0; i < 3; i += 1) {
        const tooth = randomTooth(rng, seenTeeth);
        seenTeeth.add(tooth);
        makeTreatment({
          patientId,
          appointment,
          code: rng.bool(0.5) ? 'D2140' : 'D2391',
          toothNumber: tooth,
          surface: rng.pick(SURFACES),
          status: 'completed',
        });
      }
    });
  }

  // ===================================================================
  // Three-open-invoices / eight-line-item patients: one treatment per
  // dedicated completed visit — the invoice generator handles the rest.
  // ===================================================================
  [PATIENT_INDEX.threeOpenInvoices, PATIENT_INDEX.eightLineItemInvoice].forEach((idx) => {
    const patientId = patients[idx].id;
    appointments
      .filter((a) => a.patientId === patientId)
      .forEach((appointment) => {
        makeTreatment({
          patientId,
          appointment,
          code: 'D2140',
          toothNumber: randomTooth(rng),
          surface: rng.pick(SURFACES),
          status: 'completed',
        });
      });
  });

  // ===================================================================
  // Root canal special day: completed treatment with an overdue,
  // followUpRequired follow-up (a crown that was never booked).
  // ===================================================================
  {
    const rootCanalDate = toIsoDate(dateAtDayOffset(APPOINTMENT_DAY.longRootCanalDay));
    const rootCanalAppt = appointments.find(
      (a) => a.status === 'completed' && a.startTime.startsWith(rootCanalDate),
    );
    if (rootCanalAppt) {
      makeTreatment({
        patientId: rootCanalAppt.patientId,
        appointment: rootCanalAppt,
        code: 'D3310',
        toothNumber: randomTooth(rng),
        surface: null,
        status: 'completed',
        overrides: {
          followUpRequired: true,
          followUpDate: toIsoDate(dateAtDayOffset(-1)),
        },
      });
    }
  }

  // ===================================================================
  // General population: one treatment per remaining completed
  // appointment (matched to its booked type), with an occasional second
  // treatment on the same visit for realism and volume.
  // ===================================================================
  const dedicatedPatientIds = new Set(
    [PATIENT_INDEX.fifteenPlusTeeth, PATIENT_INDEX.threeOpenInvoices, PATIENT_INDEX.eightLineItemInvoice].map(
      (idx) => patients[idx].id,
    ),
  );

  appointments
    .filter(
      (a) => a.status === 'completed' && !dedicatedPatientIds.has(a.patientId) && !treatedAppointmentIds.has(a.id),
    )
    .forEach((appointment) => {
      const typeName = typeNameById.get(appointment.appointmentTypeId) ?? 'Exam';
      const proc = rng.pick(proceduresForType(typeName));
      makeTreatment({
        patientId: appointment.patientId,
        appointment,
        code: proc.code,
        toothNumber: proc.requiresTooth ? randomTooth(rng) : null,
        surface: proc.requiresTooth && proc.requiresSurface ? rng.pick(SURFACES) : null,
        status: 'completed',
      });

      if (rng.bool(0.35)) {
        const bonusProc = rng.pick(proceduresForType(typeName));
        makeTreatment({
          patientId: appointment.patientId,
          appointment,
          code: bonusProc.code,
          toothNumber: bonusProc.requiresTooth ? randomTooth(rng) : null,
          surface: bonusProc.requiresTooth && bonusProc.requiresSurface ? rng.pick(SURFACES) : null,
          status: 'completed',
        });
      }
    });

  // ===================================================================
  // One standalone treatment per remaining TreatmentStatus value, so all
  // five statuses are represented even though the bulk above is 'completed'.
  // ===================================================================
  const extraStatusPatientIndices = [26, 42, 48, 49];
  const extraStatuses: Treatment['status'][] = ['planned', 'in_progress', 'cancelled', 'on_hold'];
  extraStatusPatientIndices.forEach((idx, i) => {
    const status = extraStatuses[i];
    makeTreatment({
      patientId: patients[idx].id,
      appointment: null,
      code: rng.pick(['D2140', 'D2740', 'D7140', 'D4341']),
      toothNumber: randomTooth(rng),
      surface: null,
      status,
      overrides: {
        startedAt: status === 'in_progress' ? toIsoDateTime(dateAtDayOffset(-rng.int(1, 10))) : null,
      },
    });
  });

  return treatments;
}
