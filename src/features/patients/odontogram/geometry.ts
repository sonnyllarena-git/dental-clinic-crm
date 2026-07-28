import type { ToothSurface } from '@/data/types';

export type Arch = 'upper' | 'lower';

/**
 * Universal Numbering System (1-32), matching the schema's own column
 * comment and the seed's tooth numbers. Screen layout, left to right:
 * upper arch 1-8 (upper right, molar->incisor) then 9-16 (upper left,
 * incisor->molar); lower arch mirrors it directly underneath so the two
 * arches line up by quadrant, 32-25 (lower right) then 24-17 (lower left).
 */
export const UPPER_ROW: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
export const LOWER_ROW: number[] = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];
export const ALL_TEETH_VISUAL_ORDER: number[] = [...UPPER_ROW, ...LOWER_ROW];

export function archOf(toothNumber: number): Arch {
  return toothNumber <= 16 ? 'upper' : 'lower';
}

/** Anterior teeth chart an incisal surface (I); posterior teeth chart occlusal (O). */
export function isAnterior(toothNumber: number): boolean {
  return (toothNumber >= 6 && toothNumber <= 11) || (toothNumber >= 22 && toothNumber <= 27);
}

export interface SurfaceGrid {
  center: ToothSurface;
  top: ToothSurface;
  bottom: ToothSurface;
  left: ToothSurface;
  right: ToothSurface;
}

/**
 * Facial always charts on the arch's outer edge (top for upper teeth,
 * bottom for lower) and lingual on the inner edge, matching how a chart
 * reads with both arches facing each other. Mesial/distal are simplified
 * to a fixed left/right per tooth rather than flipping per quadrant side —
 * a deliberate scope simplification for a schematic chart, not a claim of
 * per-tooth anatomical mesial/distal direction.
 */
export function surfaceGridFor(toothNumber: number): SurfaceGrid {
  const arch = archOf(toothNumber);
  const center = isAnterior(toothNumber) ? 'I' : 'O';
  return arch === 'upper'
    ? { center, top: 'F', bottom: 'L', left: 'M', right: 'D' }
    : { center, top: 'L', bottom: 'F', left: 'M', right: 'D' };
}

export function neighborTooth(toothNumber: number, direction: 'left' | 'right' | 'up' | 'down'): number | null {
  const arch = archOf(toothNumber);
  const row = arch === 'upper' ? UPPER_ROW : LOWER_ROW;
  const col = row.indexOf(toothNumber);

  if (direction === 'left') return col > 0 ? row[col - 1] : null;
  if (direction === 'right') return col < row.length - 1 ? row[col + 1] : null;

  // Up/down crosses arches at the same visual column.
  const otherRow = arch === 'upper' ? LOWER_ROW : UPPER_ROW;
  return otherRow[col] ?? null;
}
