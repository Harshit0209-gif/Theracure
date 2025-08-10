import {
  HandMetal,
  Stethoscope,
  Zap,
  Dumbbell,
  Calculator,
  LucideIcon,
} from "lucide-react";
import { ServiceCategory } from "@/lib/generated/serviceEnums";

export const AllServiceCatagory: ServiceCategory[] = [
  ServiceCategory.MANUAL_THERAPY,
  ServiceCategory.CONSULTATION,
  ServiceCategory.ELECTROTHERAPY,
  ServiceCategory.EXERCISE_THERAPY,
  ServiceCategory.COMBO_TREATMENT,
];

export const ServiceCategoryLabel: Record<ServiceCategory, string> = {
  [ServiceCategory.MANUAL_THERAPY]: "Manual Therapy",
  [ServiceCategory.CONSULTATION]: "Consultation",
  [ServiceCategory.ELECTROTHERAPY]: "Electrotherapy",
  [ServiceCategory.EXERCISE_THERAPY]: "Exercise Therapy",
  [ServiceCategory.COMBO_TREATMENT]: "Combo Treatment",
};

export const ServiceCategoryDescription: Record<ServiceCategory, string> = {
  [ServiceCategory.MANUAL_THERAPY]:
    "Hands-on therapeutic techniques and manual manipulation",
  [ServiceCategory.CONSULTATION]:
    "Professional assessment and consultation services",
  [ServiceCategory.ELECTROTHERAPY]:
    "Electrical stimulation and therapeutic modalities",
  [ServiceCategory.EXERCISE_THERAPY]:
    "Therapeutic exercises and rehabilitation programs",
  [ServiceCategory.COMBO_TREATMENT]:
    "Combined therapy packages for comprehensive treatment",
};

export const ServiceCategoryColors: Record<
  ServiceCategory,
  {
    bg: string;
    border: string;
    text: string;
    accent: string;
    gradient: string;
    hoverBg: string;
    selectedBg: string;
  }
> = {
  [ServiceCategory.MANUAL_THERAPY]: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    accent: "blue",
    gradient: "bg-gradient-to-r from-blue-50 to-blue-100",
    hoverBg: "hover:bg-blue-100",
    selectedBg: "bg-blue-500",
  },
  [ServiceCategory.CONSULTATION]: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    accent: "green",
    gradient: "bg-gradient-to-r from-green-50 to-emerald-50",
    hoverBg: "hover:bg-green-100",
    selectedBg: "bg-green-500",
  },
  [ServiceCategory.ELECTROTHERAPY]: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    accent: "yellow",
    gradient: "bg-gradient-to-r from-yellow-50 to-amber-50",
    hoverBg: "hover:bg-yellow-100",
    selectedBg: "bg-yellow-500",
  },
  [ServiceCategory.EXERCISE_THERAPY]: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    accent: "orange",
    gradient: "bg-gradient-to-r from-orange-50 to-red-50",
    hoverBg: "hover:bg-orange-100",
    selectedBg: "bg-orange-500",
  },
  [ServiceCategory.COMBO_TREATMENT]: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    accent: "purple",
    gradient: "bg-gradient-to-r from-purple-50 to-pink-50",
    hoverBg: "hover:bg-purple-100",
    selectedBg: "bg-purple-500",
  },
};

export const ServiceCategoryIcons: Record<ServiceCategory, LucideIcon> = {
  [ServiceCategory.MANUAL_THERAPY]: HandMetal,
  [ServiceCategory.CONSULTATION]: Stethoscope,
  [ServiceCategory.ELECTROTHERAPY]: Zap,
  [ServiceCategory.EXERCISE_THERAPY]: Dumbbell,
  [ServiceCategory.COMBO_TREATMENT]: Calculator,
};

export const ServiceCategoryOptionsMap: Record<
  ServiceCategory,
  {
    value: ServiceCategory;
    label: string;
    icon: LucideIcon;
    description: string;
    colors: (typeof ServiceCategoryColors)[ServiceCategory];
  }
> = {
  [ServiceCategory.MANUAL_THERAPY]: {
    value: ServiceCategory.MANUAL_THERAPY,
    label: ServiceCategoryLabel[ServiceCategory.MANUAL_THERAPY],
    icon: ServiceCategoryIcons[ServiceCategory.MANUAL_THERAPY],
    description: ServiceCategoryDescription[ServiceCategory.MANUAL_THERAPY],
    colors: ServiceCategoryColors[ServiceCategory.MANUAL_THERAPY],
  },
  [ServiceCategory.CONSULTATION]: {
    value: ServiceCategory.CONSULTATION,
    label: ServiceCategoryLabel[ServiceCategory.CONSULTATION],
    icon: ServiceCategoryIcons[ServiceCategory.CONSULTATION],
    description: ServiceCategoryDescription[ServiceCategory.CONSULTATION],
    colors: ServiceCategoryColors[ServiceCategory.CONSULTATION],
  },
  [ServiceCategory.ELECTROTHERAPY]: {
    value: ServiceCategory.ELECTROTHERAPY,
    label: ServiceCategoryLabel[ServiceCategory.ELECTROTHERAPY],
    icon: ServiceCategoryIcons[ServiceCategory.ELECTROTHERAPY],
    description: ServiceCategoryDescription[ServiceCategory.ELECTROTHERAPY],
    colors: ServiceCategoryColors[ServiceCategory.ELECTROTHERAPY],
  },
  [ServiceCategory.EXERCISE_THERAPY]: {
    value: ServiceCategory.EXERCISE_THERAPY,
    label: ServiceCategoryLabel[ServiceCategory.EXERCISE_THERAPY],
    icon: ServiceCategoryIcons[ServiceCategory.EXERCISE_THERAPY],
    description: ServiceCategoryDescription[ServiceCategory.EXERCISE_THERAPY],
    colors: ServiceCategoryColors[ServiceCategory.EXERCISE_THERAPY],
  },
  [ServiceCategory.COMBO_TREATMENT]: {
    value: ServiceCategory.COMBO_TREATMENT,
    label: ServiceCategoryLabel[ServiceCategory.COMBO_TREATMENT],
    icon: ServiceCategoryIcons[ServiceCategory.COMBO_TREATMENT],
    description: ServiceCategoryDescription[ServiceCategory.COMBO_TREATMENT],
    colors: ServiceCategoryColors[ServiceCategory.COMBO_TREATMENT],
  },
};
