import type { Patient } from '@/data/types';
import { usePatientInsurance, useInsuranceProviders } from '@/data/hooks';
import { QueryState } from './QueryState';
import { Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export function PatientInsuranceTab({ patient }: { patient: Patient }) {
  const { data: policies, isLoading: policiesLoading, error: policiesError } = usePatientInsurance(patient.id);
  const { data: providers, isLoading: providersLoading, error: providersError } = useInsuranceProviders();

  const isLoading = policiesLoading || providersLoading;
  const error = policiesError ?? providersError;
  const providerById = new Map((providers ?? []).map((p) => [p.id, p]));
  const list = policies ?? [];

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={list.length === 0}
      emptyMessage="This patient has no insurance on file — self-pay."
    >
      <ul className="space-y-3">
        {list.map((policy) => {
          const provider = providerById.get(policy.insuranceProviderId);
          const deductibleMet = policy.deductible > 0 && policy.deductibleMet >= policy.deductible;
          const annualPercent = policy.annualMax > 0 ? Math.round((policy.annualUsed / policy.annualMax) * 100) : 0;

          return (
            <li key={policy.id} className="rounded-md border border-hairline p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink-primary">{provider?.name ?? 'Unknown provider'}</p>
                <div className="flex gap-2">
                  <Badge tone={policy.isPrimary ? 'accent' : 'neutral'}>{policy.isPrimary ? 'Primary' : 'Secondary'}</Badge>
                  {!policy.isActive ? <Badge tone="danger">Expired</Badge> : null}
                  {!policy.verifiedAt ? <Badge tone="warning">Never verified</Badge> : null}
                </div>
              </div>
              <p className="mt-1 font-mono text-xs text-ink-secondary">Policy {policy.policyNumber}</p>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-ink-secondary">
                <div>
                  Deductible:{' '}
                  <span className="font-mono text-ink-primary">
                    {formatCurrency(policy.deductibleMet)} / {formatCurrency(policy.deductible)}
                  </span>
                  {deductibleMet ? (
                    <Badge tone="warning" className="ml-2">
                      Met
                    </Badge>
                  ) : null}
                </div>
                <div>
                  Annual max used: <span className="font-mono text-ink-primary">{annualPercent}%</span>
                  {annualPercent >= 90 ? (
                    <Badge tone="danger" className="ml-2">
                      Nearly exhausted
                    </Badge>
                  ) : null}
                </div>
                <div>
                  Effective: <span className="font-mono text-ink-primary">{formatDate(policy.effectiveDate)}</span>
                </div>
                <div>
                  {policy.verifiedAt ? (
                    <>
                      Verified: <span className="font-mono text-ink-primary">{formatDate(policy.verifiedAt)}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </QueryState>
  );
}
