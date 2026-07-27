/**
 * Deterministic accent color derived from an opaque record id (patient UUID).
 * Used so a workspace tab and its content carry the same peripheral color
 * cue every time the same record is opened, without storing a color anywhere.
 */
function hueFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function accentColorFromId(id: string): string {
  return `hsl(${hueFromId(id)}, 55%, 40%)`;
}

export function accentWashFromId(id: string): string {
  return `hsl(${hueFromId(id)}, 55%, 94%)`;
}
