import type { Treatment } from '@/data/types';
import { ALL_TEETH_VISUAL_ORDER } from './geometry';
import { TREATMENT_STATUS_LABEL } from './statusStyles';

/**
 * Screen-reader fallback for the SVG odontogram. Deliberately has no
 * interactive elements — `sr-only` hides content visually but not from
 * the tab order, so buttons in here would give sighted keyboard users 32+
 * invisible extra tab stops. Screen-reader users can still browse this
 * table's cells with their own virtual cursor without needing real focus
 * stops; the SVG chart remains the one interactive surface.
 */
export function OdontogramAccessibleTable({ treatments }: { treatments: Treatment[] }) {
  const treatmentsByTooth = new Map<number, Treatment[]>();
  treatments.forEach((t) => {
    if (t.toothNumber === null) return;
    const list = treatmentsByTooth.get(t.toothNumber) ?? [];
    list.push(t);
    treatmentsByTooth.set(t.toothNumber, list);
  });

  return (
    <table className="sr-only">
      <caption>Odontogram as a table — 32 teeth, Universal Numbering System, with recorded treatments</caption>
      <thead>
        <tr>
          <th scope="col">Tooth</th>
          <th scope="col">Surface</th>
          <th scope="col">Procedure</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {ALL_TEETH_VISUAL_ORDER.map((toothNumber) => {
          const forTooth = treatmentsByTooth.get(toothNumber) ?? [];
          if (forTooth.length === 0) {
            return (
              <tr key={toothNumber}>
                <th scope="row">Tooth {toothNumber}</th>
                <td colSpan={3}>No treatment recorded</td>
              </tr>
            );
          }
          return forTooth.map((t, i) => (
            <tr key={t.id}>
              {i === 0 ? (
                <th scope="row" rowSpan={forTooth.length}>
                  Tooth {toothNumber}
                </th>
              ) : null}
              <td>{t.surface ?? 'whole tooth'}</td>
              <td>
                {t.procedureName} ({t.procedureCode})
              </td>
              <td>{TREATMENT_STATUS_LABEL[t.status]}</td>
            </tr>
          ));
        })}
      </tbody>
    </table>
  );
}
