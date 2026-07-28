import type { KeyboardEvent, MouseEvent } from 'react';
import type { ToothSurface, TreatmentStatus } from '@/data/types';
import { surfaceGridFor } from './geometry';
import { TREATMENT_STATUS_FILL, TREATMENT_STATUS_STROKE } from './statusStyles';
import { cn } from '@/lib/cn';

const THIRD = 14;
const SIZE = 42;

interface SurfaceRectSpec {
  surface: ToothSurface;
  x: number;
  y: number;
}

function surfaceRects(toothNumber: number): SurfaceRectSpec[] {
  const grid = surfaceGridFor(toothNumber);
  return [
    { surface: grid.top, x: THIRD, y: 0 },
    { surface: grid.left, x: 0, y: THIRD },
    { surface: grid.center, x: THIRD, y: THIRD },
    { surface: grid.right, x: THIRD * 2, y: THIRD },
    { surface: grid.bottom, x: THIRD, y: THIRD * 2 },
  ];
}

export interface ToothProps {
  toothNumber: number;
  isFocused: boolean;
  surfaceStatus: Partial<Record<ToothSurface, TreatmentStatus>>;
  onFocusTooth: (toothNumber: number) => void;
  onActivateTooth: (toothNumber: number) => void;
  onActivateSurface: (toothNumber: number, surface: ToothSurface) => void;
  onNavigate: (toothNumber: number, direction: 'left' | 'right' | 'up' | 'down') => void;
  registerRef: (toothNumber: number, el: SVGGElement | null) => void;
}

/** One tooth: an outline, five clickable surface regions, and its number. */
export function Tooth({
  toothNumber,
  isFocused,
  surfaceStatus,
  onFocusTooth,
  onActivateTooth,
  onActivateSurface,
  onNavigate,
  registerRef,
}: ToothProps) {
  const rects = surfaceRects(toothNumber);
  const hasAnyTreatment = Object.keys(surfaceStatus).length > 0;

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>): void => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        onNavigate(toothNumber, 'left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        onNavigate(toothNumber, 'right');
        break;
      case 'ArrowUp':
        event.preventDefault();
        onNavigate(toothNumber, 'up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        onNavigate(toothNumber, 'down');
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onActivateTooth(toothNumber);
        break;
      default:
        break;
    }
  };

  const handleSurfaceClick = (event: MouseEvent<SVGRectElement>, surface: ToothSurface): void => {
    event.stopPropagation();
    onActivateSurface(toothNumber, surface);
  };

  return (
    <g
      ref={(el) => registerRef(toothNumber, el)}
      role="button"
      tabIndex={isFocused ? 0 : -1}
      aria-label={`Tooth ${toothNumber}${hasAnyTreatment ? ', has treatment history' : ', no treatment history'}`}
      onFocus={() => onFocusTooth(toothNumber)}
      onKeyDown={handleKeyDown}
      onClick={() => onActivateTooth(toothNumber)}
      className="cursor-pointer outline-none"
    >
      <rect x={0} y={0} width={SIZE} height={SIZE} rx={4} className="fill-surface-base stroke-hairline" strokeWidth={1} />
      {rects.map(({ surface, x, y }) => {
        const status = surfaceStatus[surface];
        return (
          <rect
            key={surface}
            x={x}
            y={y}
            width={THIRD}
            height={THIRD}
            className={cn(
              status ? TREATMENT_STATUS_FILL[status] : 'fill-transparent',
              status ? TREATMENT_STATUS_STROKE[status] : 'stroke-hairline',
              'transition-colors hover:stroke-accent',
            )}
            strokeWidth={0.75}
            onClick={(event) => handleSurfaceClick(event, surface)}
          >
            <title>{`Tooth ${toothNumber}, ${surface} surface${status ? ` — ${status.replace('_', ' ')}` : ' — no treatment'}`}</title>
          </rect>
        );
      })}
      <rect
        x={0.5}
        y={0.5}
        width={SIZE - 1}
        height={SIZE - 1}
        rx={4}
        fill="none"
        className={isFocused ? 'stroke-accent' : 'stroke-transparent'}
        strokeWidth={2}
      />
      <text x={SIZE / 2} y={SIZE + 11} textAnchor="middle" className="fill-ink-secondary font-mono text-[9px]">
        {toothNumber}
      </text>
    </g>
  );
}
