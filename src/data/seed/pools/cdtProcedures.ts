/**
 * The 10 ADA CDT codes named in the brief, each mapped to the appointment
 * type it's booked under and a typical PHP price. ADA CDT codes are used
 * for record-keeping at PH private clinics alongside PhilHealth case
 * rates, so this isn't a locale mismatch — it's what the brief's Volumes
 * table explicitly asks for, verbatim.
 */

export type ProcedureCategory = 'diagnostic' | 'preventive' | 'restorative' | 'endodontic' | 'periodontal' | 'surgical';

export interface CdtProcedureDef {
  code: string;
  name: string;
  category: ProcedureCategory;
  /** Which of the 8 seeded appointment types this procedure is booked under. */
  appointmentTypeName: string;
  typicalCost: number;
  /** Whether this procedure attaches to a specific tooth (and usually a surface). */
  requiresTooth: boolean;
  requiresSurface: boolean;
}

export const CDT_PROCEDURES: CdtProcedureDef[] = [
  {
    code: 'D0120',
    name: 'Periodic Oral Evaluation',
    category: 'diagnostic',
    appointmentTypeName: 'Exam',
    typicalCost: 800,
    requiresTooth: false,
    requiresSurface: false,
  },
  {
    code: 'D0210',
    name: 'Intraoral Complete Series Radiographic Images',
    category: 'diagnostic',
    appointmentTypeName: 'Exam',
    typicalCost: 2500,
    requiresTooth: false,
    requiresSurface: false,
  },
  {
    code: 'D1110',
    name: 'Prophylaxis - Adult',
    category: 'preventive',
    appointmentTypeName: 'Cleaning',
    typicalCost: 1500,
    requiresTooth: false,
    requiresSurface: false,
  },
  {
    code: 'D1120',
    name: 'Prophylaxis - Child',
    category: 'preventive',
    appointmentTypeName: 'Cleaning',
    typicalCost: 1000,
    requiresTooth: false,
    requiresSurface: false,
  },
  {
    code: 'D2140',
    name: 'Amalgam - One Surface, Primary or Permanent',
    category: 'restorative',
    appointmentTypeName: 'Filling',
    typicalCost: 1800,
    requiresTooth: true,
    requiresSurface: true,
  },
  {
    code: 'D2391',
    name: 'Resin-Based Composite - One Surface, Posterior',
    category: 'restorative',
    appointmentTypeName: 'Filling',
    typicalCost: 2200,
    requiresTooth: true,
    requiresSurface: true,
  },
  {
    code: 'D2740',
    name: 'Crown - Porcelain/Ceramic',
    category: 'restorative',
    appointmentTypeName: 'Crown',
    typicalCost: 15000,
    requiresTooth: true,
    requiresSurface: false,
  },
  {
    code: 'D3310',
    name: 'Root Canal Therapy - Anterior',
    category: 'endodontic',
    appointmentTypeName: 'Root Canal',
    typicalCost: 12000,
    requiresTooth: true,
    requiresSurface: false,
  },
  {
    code: 'D4341',
    name: 'Periodontal Scaling and Root Planing - Per Quadrant',
    category: 'periodontal',
    appointmentTypeName: 'Cleaning',
    typicalCost: 3500,
    requiresTooth: false,
    requiresSurface: false,
  },
  {
    code: 'D7140',
    name: 'Extraction, Erupted Tooth',
    category: 'surgical',
    appointmentTypeName: 'Extraction',
    typicalCost: 2500,
    requiresTooth: true,
    requiresSurface: false,
  },
];

export function procedureByCode(code: string): CdtProcedureDef {
  const found = CDT_PROCEDURES.find((p) => p.code === code);
  if (!found) throw new Error(`Unknown CDT code: ${code}`);
  return found;
}
