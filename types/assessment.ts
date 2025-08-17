export interface VitalsData {
  bloodPressure: { systolic: string; diastolic: string };
  pulse: string;
  weight: number;
  height: number;
  bmi: number;
  temperature: string;
  sugar: string;
}

export interface PainHistoryData {
  location: string;
  nature: string;
  type: string;
  vasScore: number;
  aggravatingFactors: string;
  relievingFactors: string;
  duration: string;
  pattern: string;
}

export interface OnObservationData {
  bodyBuild: string;
  posture: string;
  gait: string;
  weightBearing: string;
  peripheralPulses: string;
  localExam: string;
}

export interface MotorExaminationData {
  rom: string;
  arom: string;
  prom: string;
  muscleStrength: string;
  tone: string;
  grade: string;
}

export interface NeurologicalExamData {
  sensory: string;
  reflexes: string;
  tone: string;
  hmf: string;
  cranial: string;
  other: string;
}

export interface AssessmentFormData {
  patientId: string;

  vitals: VitalsData;
  chiefComplaints: string;
  onObservation: OnObservationData;
  notes: string;

  historyOfIllness: string;
  medicalHistory: string;
  painHistory: PainHistoryData;
  surgicalHistory: string;
  occupationalHistory: string;
  environmentalHistory: string;

  motorExamination: MotorExaminationData;
  neurologicalExam: NeurologicalExamData;
  onPalpation: string;
  specialTests: string;

  differentialDiagnosis: string;
  investigations: string;
  provisionalDiagnosis: string;
  physiotherapyMgmt: string;
}

export type AssessmentFormField = keyof AssessmentFormData;

export type NestedFormField<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object
        ? `${string & K}.${NestedFormField<T[K]>}`
        : string & K;
    }[keyof T]
  : never;

export type FormFieldPath =
  | AssessmentFormField
  | `vitals.${keyof VitalsData}`
  | `vitals.bloodPressure.${keyof VitalsData["bloodPressure"]}`
  | `painHistory.${keyof PainHistoryData}`
  | `onObservation.${keyof OnObservationData}`
  | `motorExamination.${keyof MotorExaminationData}`
  | `neurologicalExam.${keyof NeurologicalExamData}`;

// Default form data
export const defaultAssessmentFormData: AssessmentFormData = {
  patientId: "",

  vitals: {
    bloodPressure: { systolic: "", diastolic: "" },
    pulse: "",
    weight: 0,
    height: 0,
    bmi: 0,
    temperature: "",
    sugar: "",
  },
  chiefComplaints: "",
  onObservation: {
    bodyBuild: "",
    posture: "",
    gait: "",
    weightBearing: "",
    peripheralPulses: "",
    localExam: "",
  },
  notes: "",

  historyOfIllness: "",
  medicalHistory: "",
  painHistory: {
    location: "",
    nature: "",
    type: "",
    vasScore: 0,
    aggravatingFactors: "",
    relievingFactors: "",
    duration: "",
    pattern: "",
  },
  surgicalHistory: "",
  occupationalHistory: "",
  environmentalHistory: "",

  motorExamination: {
    rom: "",
    arom: "",
    prom: "",
    muscleStrength: "",
    tone: "",
    grade: "",
  },
  neurologicalExam: {
    sensory: "",
    reflexes: "",
    tone: "",
    hmf: "",
    cranial: "",
    other: "",
  },
  onPalpation: "",
  specialTests: "",

  differentialDiagnosis: "",
  investigations: "",
  provisionalDiagnosis: "",
  physiotherapyMgmt: "",
};

export interface AssessmentSubmissionPayload {
  assessmentData: AssessmentFormData;
  patientId: string;
  therapistId: string;
  activeSections: string[];
}

export interface AssessmentResponse {
  success: boolean;
  assessmentId?: string;
  error?: string;
}

export interface GroupConfig {
  title: string;

  color: string;

  layout: string;
  itemClass: string;
}

export interface TemplateOptions {
  key: string;
  label: string;
}
