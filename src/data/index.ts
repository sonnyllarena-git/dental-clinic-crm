/**
 * The one import point every hook (src/data/hooks/) uses. Swapping the
 * mock backend for a real API is changing these two lines — nothing that
 * imports `repository` from here needs to change at all.
 */
export { localRepository as repository } from './localRepository';
export type { Repository } from './repository';
