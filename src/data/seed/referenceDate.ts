/**
 * Re-exports the shared demo clock. Lives here too (instead of every
 * generator importing '../demoClock' directly) purely so none of the
 * dozen existing generator files needed their import path touched when
 * this moved out to be shared with the Stage 3 hooks layer as well.
 */
export * from '../demoClock';
