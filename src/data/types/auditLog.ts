export type AuditAction = 'created' | 'updated' | 'deleted' | 'accessed' | 'exported';

export interface AuditLogEntry {
  id: string;
  clinicId: string;
  userId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  changes: string | null;
  isSensitiveData: boolean;
  createdAt: string;
}
