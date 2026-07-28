import type { SeededRandom } from '../prng';

/**
 * Every locale-specific fact (names, addresses, phone shape, currency,
 * insurance providers, clinic hours) lives in this one file. Swapping
 * locale later means writing a sibling `us.ts` with the same exported
 * shape and pointing the generators at it — nothing else in src/data/seed
 * should hard-code a PH assumption.
 */

export const CURRENCY = 'PHP';
export const BUSINESS_HOURS_START_HOUR = 9;
export const BUSINESS_HOURS_END_HOUR = 18;
/** 1 = Monday ... 7 = Sunday. Mon–Sat, matching PH clinic norms. */
export const WORKING_ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6];

const phpFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: CURRENCY });
export function formatCurrency(amount: number): string {
  return phpFormatter.format(amount);
}

export const GIVEN_NAMES_FEMALE = [
  'Maria', 'Ana', 'Carmela', 'Isabel', 'Grace', 'Angelica', 'Beatriz', 'Corazon',
  'Divina', 'Elena', 'Fe', 'Gemma', 'Henrietta', 'Imelda', 'Josefina', 'Karen',
  'Liza', 'Marites', 'Nena', 'Odette', 'Perla', 'Rosario', 'Susana', 'Teresita', 'Vilma',
];

export const GIVEN_NAMES_MALE = [
  'Jose', 'Juan', 'Andres', 'Bayani', 'Carlo', 'Danilo', 'Eduardo', 'Fernando',
  'Gerardo', 'Henry', 'Ignacio', 'Jaime', 'Kevin', 'Leonardo', 'Marcelo', 'Noel',
  'Oscar', 'Pablo', 'Ramon', 'Salvador', 'Teodoro', 'Ulysses', 'Vicente', 'Wilfredo',
];

/**
 * Also doubles as the middle-name pool: PH convention is that a person's
 * middle name is their mother's maiden family name, so drawing from the
 * same list for both is authentic, not a shortcut.
 */
export const FAMILY_NAMES = [
  'Reyes', 'Santos', 'Cruz', 'Dela Cruz', 'Bautista', 'Mendoza', 'Villanueva', 'Aquino',
  'Ramos', 'Gonzales', 'Torres', 'Flores', 'Garcia', 'Rivera', 'Castillo', 'Salazar',
  'Tolentino', 'Manalo', 'Fernandez', 'Domingo', 'Delos Santos', 'Del Rosario',
  'De Guzman', 'De Leon', 'Peña', 'Muñoz', 'Tan', 'Sy', 'Lim', 'Marasigan',
];

export const NAME_SUFFIXES = ['Jr.', 'III'];

export const BARANGAYS = [
  'Barangay Poblacion', 'Barangay San Isidro', 'Barangay Santo Niño', 'Barangay Bagong Silang',
  'Barangay San Antonio', 'Barangay Malinta', 'Barangay Guadalupe Nuevo', 'Barangay Bagumbayan',
  'Barangay San Roque', 'Barangay Sto. Domingo', 'Barangay Pinagsama', 'Barangay Palingon',
];

export const STREET_NAMES = [
  'Rizal Street', 'Bonifacio Avenue', 'Mabini Street', 'Aguinaldo Highway',
  'Kalayaan Avenue', 'P. Burgos Street', 'Del Pilar Street', 'Quezon Avenue',
  'Luna Street', 'Malvar Street', 'Roxas Boulevard', 'Katipunan Avenue',
];

export interface PhLocation {
  city: string;
  province: string;
  zipCode: string;
}

export const LOCATIONS: PhLocation[] = [
  { city: 'Makati City', province: 'Metro Manila', zipCode: '1223' },
  { city: 'Quezon City', province: 'Metro Manila', zipCode: '1100' },
  { city: 'Pasig City', province: 'Metro Manila', zipCode: '1600' },
  { city: 'Mandaluyong City', province: 'Metro Manila', zipCode: '1550' },
  { city: 'Bacoor', province: 'Cavite', zipCode: '4102' },
  { city: 'Dasmariñas', province: 'Cavite', zipCode: '4114' },
  { city: 'Calamba', province: 'Laguna', zipCode: '4027' },
  { city: 'Santa Rosa', province: 'Laguna', zipCode: '4026' },
  { city: 'Angeles City', province: 'Pampanga', zipCode: '2009' },
  { city: 'Lipa City', province: 'Batangas', zipCode: '4217' },
];

export const CLINIC_LOCATION: PhLocation = LOCATIONS[0]; // Makati City

export interface InsuranceProviderDef {
  name: string;
  isGovernment: boolean;
  website: string;
}

export const INSURANCE_PROVIDER_DEFS: InsuranceProviderDef[] = [
  { name: 'PhilHealth', isGovernment: true, website: 'https://www.philhealth.gov.ph' },
  { name: 'Maxicare Healthcare Corporation', isGovernment: false, website: 'https://www.maxicare.com.ph' },
  { name: 'Medicard Philippines', isGovernment: false, website: 'https://www.medicard.com.ph' },
  { name: 'Intellicare', isGovernment: false, website: 'https://www.intellicare.com.ph' },
  { name: 'PhilCare', isGovernment: false, website: 'https://www.philcare.com.ph' },
  { name: 'Insular Health Care', isGovernment: false, website: 'https://www.insularhealthcare.com.ph' },
];

export const PATIENT_TAGS = [
  'VIP', 'Cash-pay', 'Referral', 'Insurance-pending', 'Needs Follow-up',
  'New Patient', 'Family Plan', 'Senior Discount', 'PWD Discount', 'Orthodontic Case',
];

export const ALLERGY_POOL = [
  'Penicillin', 'Latex', 'Local Anesthetic (Lidocaine)', 'Sulfa Drugs', 'Ibuprofen',
  'Aspirin', 'Iodine', 'Nickel', 'Codeine', 'Amoxicillin',
];

export const MEDICATION_POOL = [
  'Losartan', 'Metformin', 'Amlodipine', 'Salbutamol Inhaler', 'Levothyroxine',
  'Multivitamins', 'Omeprazole', 'Cetirizine',
];

export const MEDICAL_CONDITION_POOL = [
  'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Hypothyroidism', 'Anemia',
  'Anxiety Disorder', 'GERD',
];

export const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];

const MOBILE_PREFIXES = [
  '905', '906', '915', '916', '917', '918', '919', '920', '921', '926', '927', '928',
  '929', '935', '936', '937', '938', '939', '945', '946', '947', '948', '949', '956',
  '957', '958', '959', '966', '967', '968', '969', '975', '976', '977', '978', '979',
];

export function generateMobilePhone(rng: SeededRandom): string {
  const prefix = rng.pick(MOBILE_PREFIXES);
  const rest = String(rng.int(0, 10_000_000)).padStart(7, '0');
  return `+63 ${prefix} ${rest.slice(0, 3)} ${rest.slice(3)}`;
}

export function generateLandlinePhone(rng: SeededRandom): string {
  const rest = String(rng.int(0, 100_000_000)).padStart(8, '0');
  return `+63 2 ${rest.slice(0, 4)} ${rest.slice(4)}`;
}

/** Explicit map rather than a Unicode-range regex, so the source stays plain ASCII. */
const ACCENT_FOLD: Record<string, string> = {
  ñ: 'n', Ñ: 'N', á: 'a', Á: 'A', é: 'e', É: 'E',
  í: 'i', Í: 'I', ó: 'o', Ó: 'O', ú: 'u', Ú: 'U',
};

function foldAccents(value: string): string {
  return value
    .split('')
    .map((ch) => ACCENT_FOLD[ch] ?? ch)
    .join('');
}

export function generateEmail(rng: SeededRandom, firstName: string, lastName: string): string {
  const slug = foldAccents(`${firstName}.${lastName}`)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '');
  const domain = rng.pick(EMAIL_DOMAINS);
  const suffix = rng.int(1, 999);
  return `${slug}${suffix}@${domain}`;
}
