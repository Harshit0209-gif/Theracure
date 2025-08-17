import { GroupConfig, NeurologicalExamData } from "@/types/assessment";
import { TemplateOptions } from "lodash";

export const ASSESSMENT_TEMPLATES = {
  initial: [
    "historyOfIllness",
    "medicalHistory",
    "painHistory",
    "motorExamination",
    "provisionalDiagnosis",
    "physiotherapyMgmt",
  ],
  followup: ["painHistory", "onPalpation", "physiotherapyMgmt"],
  comprehensive: "all",
};
export const NEUROLOGICAL_TONES = [
  "normal",
  "hypotonic",
  "hypertonic",
  "spastic",
  "flaccid",
] as const;

export const NEUROLOGICAL_FIELDS = [
  {
    key: "sensory" as keyof NeurologicalExamData,
    label: "Sensory",
    placeholder: "Sensory examination findings...",
  },
  {
    key: "reflexes" as keyof NeurologicalExamData,
    label: "Reflexes",
    placeholder: "Reflex testing results...",
  },
  {
    key: "hmf" as keyof NeurologicalExamData,
    label: "Higher Mental Function",
    placeholder: "Cognitive assessment...",
  },
  {
    key: "cranial" as keyof NeurologicalExamData,
    label: "Cranial Nerves",
    placeholder: "Cranial nerve examination...",
  },
] as const;

export const TEMPLATE_OPTIONS = [
  { key: "initial" as keyof TemplateOptions, label: "Initial Assessment" },
  { key: "followup" as keyof TemplateOptions, label: "Follow-up" },
  { key: "comprehensive" as keyof TemplateOptions, label: "Comprehensive" },
] as const;

export const SECTION_GROUP_CONFIGS: Record<string, GroupConfig> = {
  essential: {
    title: "Essential Information",
    color: "bg-blue-500",
    layout: "space-y-3",
    itemClass: "",
  },
  history: {
    title: "History & Background",
    color: "bg-amber-500",
    layout: "grid grid-cols-1 md:grid-cols-2 gap-3",
    itemClass: "col-span-1",
  },
  examination: {
    title: "On Examination",
    color: "bg-green-500",
    layout: "space-y-3",
    itemClass: "",
  },
  assessment: {
    title: "Assessment & Planning",
    color: "bg-purple-500",
    layout: "space-y-3",
    itemClass: "",
  },
  documentation: {
    title: "Documentation",
    color: "bg-gray-500",
    layout: "space-y-3",
    itemClass: "",
  },
};
