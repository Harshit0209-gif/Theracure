import { AssessmentFormData } from "@/types/assessment";

export interface PrescriptionData {
  id: string;
  sessionId: string;
  patientId: string;
  therapistId: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    patientName: string;
    age: number;
    gender: string;
    phone: string;
    email: string | null;
  };
  therapist: {
    id: string;
    specialization: string;
    qualification: string | null;
    experiences?: string | null;
    user: {
      name: string;
      email: string;
    };
  };
  session: {
    id: string;
    sessionDate: string;
    sessionData: string;
    sessionNotes: string;
    completed: boolean;
  };
}
