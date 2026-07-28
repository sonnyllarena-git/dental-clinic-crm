import { FileX } from 'lucide-react';

/** Honest placeholder — there's no file-storage layer in this offline demo. */
export function PatientDocumentsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-hairline p-10 text-center">
      <FileX className="h-8 w-8 text-ink-secondary" aria-hidden />
      <p className="text-sm font-medium text-ink-primary">Document storage isn't built yet</p>
      <p className="max-w-sm text-xs text-ink-secondary">
        This offline demo has no file-storage layer. Uploaded X-rays, consent forms, and referral letters would
        live here once that exists.
      </p>
    </div>
  );
}
