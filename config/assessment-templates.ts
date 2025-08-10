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
    badge: "Always Required",
    color: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-800",
    layout: "space-y-3",
    itemClass: "",
  },
  history: {
    title: "History & Background",
    badge: "Optional",
    color: "bg-amber-500",
    badgeColor: "bg-amber-100 text-amber-800",
    layout: "grid grid-cols-1 md:grid-cols-2 gap-3",
    itemClass: "col-span-1",
  },
  examination: {
    title: "Clinical Examination",
    badge: "Optional",
    color: "bg-green-500",
    badgeColor: "bg-green-100 text-green-800",
    layout: "space-y-3",
    itemClass: "",
  },
  assessment: {
    title: "Assessment & Planning",
    badge: "Optional",
    color: "bg-purple-500",
    badgeColor: "bg-purple-100 text-purple-800",
    layout: "space-y-3",
    itemClass: "",
  },
  documentation: {
    title: "Documentation",
    badge: "Required",
    color: "bg-gray-500",
    badgeColor: "bg-gray-100 text-gray-800",
    layout: "space-y-3",
    itemClass: "",
  },
};
