import { useMemo, useRef, useState } from 'react';
import type { Treatment, ToothSurface, TreatmentStatus } from '@/data/types';
import { UPPER_ROW, LOWER_ROW, neighborTooth } from './geometry';
import { Tooth } from './Tooth';
import { OdontogramAccessibleTable } from './OdontogramAccessibleTable';
import { TREATMENT_STATUS_LABEL, TREATMENT_STATUS_FILL, TREATMENT_STATUS_STROKE } from './statusStyles';
import { cn } from '@/lib/cn';

export interface OdontogramProps {
  treatments: Treatment[];
  onSelectTooth: (toothNumber: number) => void;
  onSelectSurface: (toothNumber: number, surface: ToothSurface) => void;
}

const TOOTH_WIDTH = 42;
const TOOTH_HEIGHT = 53;
const GAP = 4;
const ARCH_GAP = 20;

/**
 * The 32-tooth chart: SVG for sighted/pointer/keyboard interaction, plus a
 * plain-table fallback (OdontogramAccessibleTable) for screen readers.
 * Arrow keys move a roving-tabindex focus tooth-to-tooth; Enter opens the
 * focused tooth (via onSelectTooth). Clicking one of a tooth's five
 * surfaces directly pre-fills both tooth and surface (onSelectSurface).
 */
export function Odontogram({ treatments, onSelectTooth, onSelectSurface }: OdontogramProps) {
  const [focusedTooth, setFocusedTooth] = useState(1);
  const toothRefs = useRef(new Map<number, SVGGElement | null>());

  const statusByTooth = useMemo(() => {
    const map = new Map<number, Partial<Record<ToothSurface, TreatmentStatus>>>();
    treatments.forEach((t) => {
      if (t.toothNumber === null) return;
      const existing = map.get(t.toothNumber) ?? {};
      // Whole-tooth procedures (crown, extraction, root canal) don't record
      // a surface — mark both center-position surfaces so the chart still
      // shows a fill rather than looking untreated.
      const surfaces: ToothSurface[] = t.surface ? [t.surface] : ['O', 'I'];
      surfaces.forEach((s) => {
        existing[s] = t.status;
      });
      map.set(t.toothNumber, existing);
    });
    return map;
  }, [treatments]);

  const treatedToothCount = statusByTooth.size;

  const registerRef = (toothNumber: number, el: SVGGElement | null): void => {
    toothRefs.current.set(toothNumber, el);
  };

  const focusTooth = (toothNumber: number): void => {
    setFocusedTooth(toothNumber);
    toothRefs.current.get(toothNumber)?.focus();
  };

  const handleNavigate = (fromTooth: number, direction: 'left' | 'right' | 'up' | 'down'): void => {
    const next = neighborTooth(fromTooth, direction);
    if (next) focusTooth(next);
  };

  const archWidth = UPPER_ROW.length * (TOOTH_WIDTH + GAP) - GAP;
  const totalHeight = TOOTH_HEIGHT * 2 + ARCH_GAP;

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-hairline bg-surface-raised p-4">
        <svg
          role="grid"
          aria-label="Odontogram — 32-tooth dental chart"
          viewBox={`0 0 ${archWidth} ${totalHeight}`}
          width={archWidth}
          height={totalHeight}
          className="min-w-[720px]"
        >
          {UPPER_ROW.map((toothNumber, col) => (
            <g key={toothNumber} transform={`translate(${col * (TOOTH_WIDTH + GAP)}, 0)`}>
              <Tooth
                toothNumber={toothNumber}
                isFocused={focusedTooth === toothNumber}
                surfaceStatus={statusByTooth.get(toothNumber) ?? {}}
                onFocusTooth={setFocusedTooth}
                onActivateTooth={onSelectTooth}
                onActivateSurface={onSelectSurface}
                onNavigate={handleNavigate}
                registerRef={registerRef}
              />
            </g>
          ))}
          {LOWER_ROW.map((toothNumber, col) => (
            <g key={toothNumber} transform={`translate(${col * (TOOTH_WIDTH + GAP)}, ${TOOTH_HEIGHT + ARCH_GAP})`}>
              <Tooth
                toothNumber={toothNumber}
                isFocused={focusedTooth === toothNumber}
                surfaceStatus={statusByTooth.get(toothNumber) ?? {}}
                onFocusTooth={setFocusedTooth}
                onActivateTooth={onSelectTooth}
                onActivateSurface={onSelectSurface}
                onNavigate={handleNavigate}
                registerRef={registerRef}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {(Object.keys(TREATMENT_STATUS_LABEL) as TreatmentStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <span
              aria-hidden
              className={cn('h-3 w-3 rounded-sm border', TREATMENT_STATUS_FILL[status], TREATMENT_STATUS_STROKE[status])}
            />
            {TREATMENT_STATUS_LABEL[status]}
          </div>
        ))}
      </div>

      <p className="mt-2 text-2xs text-ink-secondary">
        {treatedToothCount === 0
          ? 'No treatments recorded yet.'
          : `${treatedToothCount} ${treatedToothCount === 1 ? 'tooth' : 'teeth'} with recorded treatment.`}{' '}
        Use the arrow keys to move between teeth and Enter to open one.
      </p>

      <OdontogramAccessibleTable treatments={treatments} />
    </div>
  );
}
