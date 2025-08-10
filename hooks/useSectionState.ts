import { SECTION_GROUPS } from "@/config/assessment-sections";
import { ASSESSMENT_TEMPLATES } from "@/config/assessment-templates";
import { SectionConfig } from "@/types/section";
import {
  AssessmentFormData,
  defaultAssessmentFormData,
  VitalsData,
  PainHistoryData,
  OnObservationData,
  MotorExaminationData,
  NeurologicalExamData,
} from "@/types/assessment";
import { useState } from "react";

interface SectionState {
  [sectionId: string]: SectionConfig & {
    expanded: boolean;
  };
}

interface UseSectionStateProps {
  formData?: AssessmentFormData;
  setFormData?: React.Dispatch<React.SetStateAction<AssessmentFormData>>;
}

export const useSectionState = ({
  formData,
  setFormData,
}: UseSectionStateProps = {}) => {
  const [sections, setSections] = useState(() => {
    const allSections: SectionState = {};
    Object.values(SECTION_GROUPS)
      .flat()
      .forEach((section) => {
        allSections[section.id] = {
          ...section,
          active: section.defaultActive ?? section.active ?? false,
          expanded: section.required || section.defaultActive || section.active,
        };
      });
    return allSections;
  });

  const clearSectionData = (sectionId: string): void => {
    if (!setFormData) return;

    setFormData((prev) => {
      const newData = { ...prev };

      switch (sectionId) {
        case "vitals":
          newData.vitals = { ...defaultAssessmentFormData.vitals };
          break;
        case "painHistory":
          newData.painHistory = { ...defaultAssessmentFormData.painHistory };
          break;
        case "onObservation":
          newData.onObservation = {
            ...defaultAssessmentFormData.onObservation,
          };
          break;
        case "motorExamination":
          newData.motorExamination = {
            ...defaultAssessmentFormData.motorExamination,
          };
          break;
        case "neurologicalExam":
          newData.neurologicalExam = {
            ...defaultAssessmentFormData.neurologicalExam,
          };
          break;
        case "historyOfIllness":
        case "medicalHistory":
        case "surgicalHistory":
        case "occupationalHistory":
        case "environmentalHistory":
        case "onPalpation":
        case "specialTests":
        case "differentialDiagnosis":
        case "investigations":
        case "provisionalDiagnosis":
        case "physiotherapyMgmt":
        case "chiefComplaints":
        case "notes":
          if (sectionId in defaultAssessmentFormData) {
            (newData as any)[sectionId] = (defaultAssessmentFormData as any)[
              sectionId
            ];
          }
          break;
        default:
          if (sectionId in defaultAssessmentFormData) {
            (newData as any)[sectionId] = (defaultAssessmentFormData as any)[
              sectionId
            ];
          }
          break;
      }

      return newData;
    });
  };

  const toggleSection = (sectionId: string) => {
    setSections((prev) => {
      const currentSection = prev[sectionId];
      const newActive = !currentSection.active;

      if (!newActive && setFormData) {
        clearSectionData(sectionId);
      }

      return {
        ...prev,
        [sectionId]: {
          ...currentSection,
          active: newActive,

          expanded: newActive ? true : currentSection.expanded,
        },
      };
    });
  };

  const toggleExpansion = (sectionId: string) => {
    setSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        expanded: !prev[sectionId].expanded,
      },
    }));
  };

  const setTemplate = (templateName: keyof typeof ASSESSMENT_TEMPLATES) => {
    const template = ASSESSMENT_TEMPLATES[templateName];
    setSections((prev) => {
      const newSections: SectionState = { ...prev };

      Object.keys(newSections).forEach((key) => {
        if (!newSections[key].required) {
          const wasActive = newSections[key].active;
          newSections[key].active = false;
          newSections[key].expanded = false;

          if (wasActive && setFormData) {
            clearSectionData(key);
          }
        }
      });

      if (template === "all") {
        Object.keys(newSections).forEach((key) => {
          if (newSections[key].toggle !== false) {
            newSections[key].active = true;
            newSections[key].expanded = true;
          }
        });
      } else if (Array.isArray(template)) {
        template.forEach((sectionId) => {
          if (newSections[sectionId]) {
            newSections[sectionId].active = true;
            newSections[sectionId].expanded = true;
          }
        });
      }

      return newSections;
    });
  };

  const sectionHasData = (sectionId: string): boolean => {
    if (!formData) return false;

    switch (sectionId) {
      case "vitals":
        const vitals = formData.vitals;
        const defaultVitals = defaultAssessmentFormData.vitals;
        return !!(
          vitals.bloodPressure.systolic !==
            defaultVitals.bloodPressure.systolic ||
          vitals.bloodPressure.diastolic !==
            defaultVitals.bloodPressure.diastolic ||
          vitals.pulse !== defaultVitals.pulse ||
          vitals.temperature !== defaultVitals.temperature ||
          vitals.sugar !== defaultVitals.sugar ||
          vitals.weight !== defaultVitals.weight ||
          vitals.height !== defaultVitals.height
        );

      case "painHistory":
        const pain = formData.painHistory;
        const defaultPain = defaultAssessmentFormData.painHistory;
        return !!(
          pain.location !== defaultPain.location ||
          pain.nature !== defaultPain.nature ||
          pain.type !== defaultPain.type ||
          pain.vasScore !== defaultPain.vasScore ||
          pain.aggravatingFactors !== defaultPain.aggravatingFactors ||
          pain.relievingFactors !== defaultPain.relievingFactors ||
          pain.duration !== defaultPain.duration ||
          pain.pattern !== defaultPain.pattern
        );

      case "onObservation":
        const obs = formData.onObservation;
        const defaultObs = defaultAssessmentFormData.onObservation;
        return !!(
          obs.bodyBuild !== defaultObs.bodyBuild ||
          obs.posture !== defaultObs.posture ||
          obs.gait !== defaultObs.gait ||
          obs.weightBearing !== defaultObs.weightBearing ||
          obs.peripheralPulses !== defaultObs.peripheralPulses ||
          obs.localExam !== defaultObs.localExam
        );

      case "motorExamination":
        const motor = formData.motorExamination;
        const defaultMotor = defaultAssessmentFormData.motorExamination;
        return !!(
          motor.rom !== defaultMotor.rom ||
          motor.arom !== defaultMotor.arom ||
          motor.prom !== defaultMotor.prom ||
          motor.muscleStrength !== defaultMotor.muscleStrength ||
          motor.tone !== defaultMotor.tone ||
          motor.grade !== defaultMotor.grade
        );

      case "neurologicalExam":
        const neuro = formData.neurologicalExam;
        const defaultNeuro = defaultAssessmentFormData.neurologicalExam;
        return !!(
          neuro.sensory !== defaultNeuro.sensory ||
          neuro.reflexes !== defaultNeuro.reflexes ||
          neuro.tone !== defaultNeuro.tone ||
          neuro.hmf !== defaultNeuro.hmf ||
          neuro.cranial !== defaultNeuro.cranial ||
          neuro.other !== defaultNeuro.other
        );

      default:
        if (sectionId in formData && sectionId in defaultAssessmentFormData) {
          const currentValue = (formData as any)[sectionId];
          const defaultValue = (defaultAssessmentFormData as any)[sectionId];
          return currentValue !== defaultValue && !!currentValue?.trim?.();
        }
        return false;
    }
  };

  const getActiveSectionsWithData = (): string[] => {
    return Object.keys(sections).filter(
      (sectionId) => sections[sectionId].active && sectionHasData(sectionId)
    );
  };

  const validateRequiredSections = (): {
    isValid: boolean;
    missingSections: string[];
  } => {
    const missingSections: string[] = [];

    Object.keys(sections).forEach((sectionId) => {
      const section = sections[sectionId];
      if (section.required && section.active && !sectionHasData(sectionId)) {
        missingSections.push(section.name);
      }
    });

    return {
      isValid: missingSections.length === 0,
      missingSections,
    };
  };

  const resetFormToDefaults = (): void => {
    if (!setFormData) return;
    setFormData({ ...defaultAssessmentFormData });
  };

  const resetSectionsToDefaults = (sectionIds: string[]): void => {
    if (!setFormData) return;
    sectionIds.forEach((sectionId) => clearSectionData(sectionId));
  };

  return {
    sections,
    toggleSection,
    toggleExpansion,
    setTemplate,
    clearSectionData,
    sectionHasData,
    getActiveSectionsWithData,
    validateRequiredSections,
    resetFormToDefaults,
    resetSectionsToDefaults,
  };
};
