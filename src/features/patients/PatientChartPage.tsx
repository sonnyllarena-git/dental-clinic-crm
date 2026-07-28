import { useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { usePatient, usePatientMedicalHistory } from '@/data/hooks';
import { PatientSafetyBanner } from './components/PatientSafetyBanner';
import { PatientOverviewTab } from './components/PatientOverviewTab';
import { PatientTreatmentsTab } from './components/PatientTreatmentsTab';
import { PatientNotesTab } from './components/PatientNotesTab';
import { PatientInsuranceTab } from './components/PatientInsuranceTab';
import { PatientBillingTab } from './components/PatientBillingTab';
import { PatientDocumentsTab } from './components/PatientDocumentsTab';
import { Tabs, TabsList, TabsTrigger, TabsContent, Skeleton } from '@/components/ui';

/**
 * `/patients/:id`. The safety banner renders above the tabs, outside any
 * further-nested scroll container, so it stays pinned via `sticky` to the
 * app shell's own scrolling content area — see PatientSafetyBanner.
 */
export function PatientChartPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading: patientLoading, error: patientError } = usePatient(id);
  const { data: medicalHistory } = usePatientMedicalHistory(id);

  if (patientLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (patientError) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/5 p-4 text-sm text-status-danger"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {patientError.message}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-sm text-ink-secondary">This chart isn't available. Go to the Patients list to open a patient.</p>
      </div>
    );
  }

  return (
    <div>
      <PatientSafetyBanner patient={patient} medicalHistory={medicalHistory ?? null} />
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="treatments">Treatments</TabsTrigger>
            <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <PatientOverviewTab patient={patient} medicalHistory={medicalHistory ?? null} />
          </TabsContent>
          <TabsContent value="treatments">
            <PatientTreatmentsTab patient={patient} />
          </TabsContent>
          <TabsContent value="notes">
            <PatientNotesTab patient={patient} />
          </TabsContent>
          <TabsContent value="insurance">
            <PatientInsuranceTab patient={patient} />
          </TabsContent>
          <TabsContent value="billing">
            <PatientBillingTab patient={patient} />
          </TabsContent>
          <TabsContent value="documents">
            <PatientDocumentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
