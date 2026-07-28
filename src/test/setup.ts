import '@testing-library/jest-dom/vitest';
// jsdom doesn't implement IndexedDB — this polyfills it so Dexie
// (src/data/db.ts) works under Vitest exactly like it does in a real browser.
import 'fake-indexeddb/auto';

// jsdom has no pointer-capture or scroll implementation. Radix's Select
// (and other popover-driven primitives) call these unconditionally when a
// trigger is opened via pointer/keyboard, so any test that opens one throws
// without this polyfill.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
