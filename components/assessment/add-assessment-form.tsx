import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  User,
  Loader2,
  FileText,
  Activity,
  Save,
  Calendar,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PrintAssessment from "@/components/assessment/print-assessment";
import { useAuth } from "@/contexts/auth-context";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";
import { Patient as PatientInfo } from "@/types/patient";
import { useSectionState } from "@/hooks/useSectionState";
import { VitalsSection } from "./sections/VitalsSection";
import { PainHistorySection } from "./sections/PainHistorySection";
import { ObservationSection } from "./sections/ObservationSection";
import { SectionCard } from "./sections/SectionCard";
import { SECTION_GROUPS } from "@/config/assessment-sections";
import {
  ASSESSMENT_TEMPLATES,
  NEUROLOGICAL_FIELDS,
  NEUROLOGICAL_TONES,
  SECTION_GROUP_CONFIGS,
  TEMPLATE_OPTIONS,
} from "@/config/assessment-templates";
import { MotorExaminationSection } from "./sections/MotorExaminationSection";
import {
  AssessmentFormData,
  defaultAssessmentFormData,
  AssessmentSubmissionPayload,
  NeurologicalExamData,
  GroupConfig,
} from "@/types/assessment";
import { SectionConfig } from "@/types/section";

interface AddAssessmentDialogProps {
  onAssessmentAdded?: () => void;
}

interface TemplateOption {
  key: keyof typeof ASSESSMENT_TEMPLATES;
  label: string;
}

export function AddAssessmentDialog({
  onAssessmentAdded,
}: AddAssessmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [assessmentType, setAssessmentType] =
    useState<keyof typeof ASSESSMENT_TEMPLATES>("initial");

  const [formData, setFormData] = useState<AssessmentFormData>(
    defaultAssessmentFormData
  );

  const { user } = useAuth();
  const {
    sections,
    toggleSection,
    toggleExpansion,
    setTemplate,
    validateRequiredSections,
    getActiveSectionsWithData,
  } = useSectionState({
    formData,
    setFormData,
  });

  const fetchPatientDetails = async (id: string): Promise<void> => {
    if (!id.trim() || id.length < 7) {
      setPatientInfo(null);
      return;
    }

    try {
      setSearchingPatient(true);
      const response = await fetch(`/api/patients/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Patient Not Found",
            description: "No patient found with this ID",
            variant: "destructive",
          });
        } else {
          throw new Error("Failed to fetch patient");
        }
        setPatientInfo(null);
        return;
      }

      const data = await response.json();
      if (data.success) {
        const patient = data.patient as PatientInfo;
        setPatientInfo(patient);
        setFormData((prev) => ({
          ...prev,
          patientId: id,
          vitals: {
            ...prev.vitals,
            height: Number(patient.height) || 0,
            weight: Number(patient.weight) || 0,
          },
          medicalHistory: patient.medicalHistory || "",
        }));

        toast({
          title: "Patient Found",
          description: `Patient: ${patient.patientName}`,
        });
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
      toast({
        title: "Error",
        description: "Failed to fetch patient details",
        variant: "destructive",
      });
      setPatientInfo(null);
    } finally {
      setSearchingPatient(false);
    }
  };

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handlePatientIdChange = (value: string): void => {
    setPatientId(value);

    if (!value.trim()) {
      setPatientInfo(null);
      setFormData((prev) => ({ ...prev, patientId: "" }));
      return;
    }

    const normalizedValue = value.toUpperCase().trim();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchPatientDetails(normalizedValue);
    }, 500);
  };

  const handleTemplateChange = (
    templateName: keyof typeof ASSESSMENT_TEMPLATES
  ): void => {
    setAssessmentType(templateName);
    setTemplate(templateName);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create an assessment",
        variant: "destructive",
      });
      return;
    }

    if (!patientInfo) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid patient ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const payloadData: AssessmentSubmissionPayload = {
        assessmentData: formData,
        patientId: patientInfo.id,
        therapistId: user.id,
        activeSections: getActiveSectionsWithData(),
      };

      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: data.success ? "Success" : "Notice",
          description: data.message || "Assessment created successfully",
          variant: data.success ? "default" : "destructive",
        });

        if (data.success) {
          resetForm();
          setOpen(false);
          onAssessmentAdded?.();
        }
      } else {
        toast({
          title: "Error",
          description:
            data.error || data.message || "Failed to create assessment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast({
        title: "Network or Server Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setPatientId("");
    setPatientInfo(null);
    setFormData(defaultAssessmentFormData);
  };

  const handleOpenChange = (newOpen: boolean): void => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const updateNeurologicalExam = (
    key: keyof NeurologicalExamData,
    value: string
  ): void => {
    setFormData((prev) => ({
      ...prev,
      neurologicalExam: { ...prev.neurologicalExam, [key]: value },
    }));
  };

  const renderNeurologicalExamSection = (
    isActive: boolean
  ): React.ReactElement => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NEUROLOGICAL_FIELDS.map((field) => (
          <div key={field.key}>
            <Label className="text-xs">{field.label}</Label>
            <Textarea
              placeholder={field.placeholder}
              className={`h-20 text-sm ${!isActive ? "bg-gray-100" : ""}`}
              value={formData.neurologicalExam[field.key]}
              onChange={(e) =>
                updateNeurologicalExam(field.key, e.target.value)
              }
              disabled={!isActive}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Other Findings</Label>
          <Textarea
            placeholder="Other neurological findings..."
            className={`h-8 text-sm ${!isActive ? "bg-gray-100" : ""}`}
            value={formData.neurologicalExam.other}
            onChange={(e) => updateNeurologicalExam("other", e.target.value)}
            disabled={!isActive}
          />
        </div>
      </div>
    </div>
  );

  const renderSectionContent = (
    sectionId: string,
    isActive: boolean
  ): React.ReactElement => {
    switch (sectionId) {
      case "vitals":
        return (
          <VitalsSection
            formData={formData}
            setFormData={setFormData}
            patientInfo={patientInfo}
            disabled={!isActive}
          />
        );
      case "painHistory":
        return (
          <PainHistorySection
            formData={formData}
            setFormData={setFormData}
            disabled={!isActive}
          />
        );
      case "onObservation":
        return (
          <ObservationSection
            formData={formData}
            setFormData={setFormData}
            disabled={!isActive}
          />
        );
      case "motorExamination":
        return (
          <MotorExaminationSection
            formData={formData}
            setFormData={setFormData}
            disabled={!isActive}
          />
        );
      case "neurologicalExam":
        return renderNeurologicalExamSection(isActive);
      default:
        return (
          <Textarea
            placeholder={`Enter ${sections[sectionId]?.name.toLowerCase()}...`}
            className={`min-h-[100px] text-sm ${
              !isActive ? "bg-gray-100" : ""
            }`}
            value={(formData as any)[sectionId] || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [sectionId]: e.target.value }))
            }
            disabled={!isActive}
          />
        );
    }
  };

  const renderSection = (section: SectionConfig): React.ReactElement | null => {
    const sectionState = sections[section.id];
    const isActive = sectionState?.active ?? section.defaultActive;
    const isExpanded = sectionState?.expanded ?? false;
    const isRequired = section.required;

    return (
      <SectionCard
        key={section.id}
        section={section}
        onToggle={() => toggleSection(section.id)}
        onExpand={() => toggleExpansion(section.id)}
        isActive={isActive}
        isExpanded={isExpanded}
        isRequired={isRequired}
      >
        {renderSectionContent(section.id, isActive)}
      </SectionCard>
    );
  };

  const renderSectionGroup = (
    groupName: string,
    groupSections: SectionConfig[],
    groupConfig: GroupConfig
  ): React.ReactElement => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`h-6 w-1 ${groupConfig.color} rounded`}></div>
        <h3 className="text-lg font-semibold text-gray-800">
          {groupConfig.title}
        </h3>
      </div>

      <div className={groupConfig.layout}>
        {groupSections.map((section) => (
          <div key={section.id} className={groupConfig.itemClass}>
            {renderSection(section)}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPatientDetails = (): React.ReactElement | null => {
    if (!patientInfo) return null;

    return (
      <div className="bg-white border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-800">Patient Found</span>
        </div>

        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
          <div>
            <span className="font-medium text-gray-600">Name:</span>
            <p className="text-gray-900">{patientInfo.patientName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">ID:</span>
            <p className="text-gray-900">{patientInfo.id}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Age:</span>
            <p className="text-gray-900">{patientInfo.age} years</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Gender:</span>
            <p className="text-gray-900 capitalize">{patientInfo.gender}</p>
          </div>
        </div>

        {/* Physical Measurements & BMI */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Physical Measurements
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Height:</span>
              <p className="text-gray-900">
                {patientInfo.height
                  ? `${patientInfo.height} cm`
                  : "Not recorded"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Weight:</span>
              <p className="text-gray-900">
                {patientInfo.weight
                  ? `${patientInfo.weight} kg`
                  : "Not recorded"}
              </p>
            </div>

            {/* BMI Calculation */}
            {patientInfo.height && patientInfo.weight && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">BMI:</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const bmiData = calculateSimpleBMI(
                      Number(patientInfo.weight),
                      Number(patientInfo.height)
                    );
                    return (
                      <>
                        <span className="text-gray-900 font-medium">
                          {bmiData.bmi}
                        </span>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: bmiData.color + "20",
                            color: bmiData.color,
                            border: `1px solid ${bmiData.color}40`,
                          }}
                        >
                          {bmiData.status}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medical History */}
        {patientInfo.medicalHistory && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-600">
                Medical History:
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-md border">
              <p className="text-gray-900 text-sm whitespace-pre-wrap">
                {patientInfo.medicalHistory}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  function removeEmpty(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removeEmpty);
    } else if (obj && typeof obj === "object") {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        const cleaned = removeEmpty(value);
        if (
          cleaned !== null &&
          cleaned !== undefined &&
          cleaned !== "" &&
          !(typeof cleaned === "number" && isNaN(cleaned))
        ) {
          acc[key] = cleaned;
        }
        return acc;
      }, {} as any);
    }
    return obj;
  }

  const activeSectionsCount = Object.values(sections).filter(
    (s) => s.active
  ).length;
  const totalSections = Object.values(sections).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Assessment
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Create New Patient Assessment
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Search Section */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-3">
                Patient Information
              </h3>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="patientId">Patient ID *</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="patientId"
                        value={patientId}
                        onChange={(e) => handlePatientIdChange(e.target.value)}
                        placeholder="Enter Patient ID (e.g., THRC256)"
                        className="pl-10"
                        disabled={loading}
                      />
                      {searchingPatient && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Assessment Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                        className="w-40"
                      />
                    </div>
                  </div>
                </div>

                {renderPatientDetails()}
              </div>
            </div>

            {/* Assessment Type Selection */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Label className="font-medium">Assessment Type:</Label>
                  <div className="flex gap-2">
                    {TEMPLATE_OPTIONS.map((template) => (
                      <Button
                        key={template.key}
                        type="button"
                        variant={
                          assessmentType ===
                          (template.key as keyof typeof ASSESSMENT_TEMPLATES)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleTemplateChange(
                            template.key as keyof typeof ASSESSMENT_TEMPLATES
                          )
                        }
                        className="text-xs"
                      >
                        {template.label}
                      </Button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activeSectionsCount} of {totalSections} sections active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Groups */}
            {Object.entries(SECTION_GROUPS).map(
              ([groupName, groupSections]) => (
                <React.Fragment key={groupName}>
                  {renderSectionGroup(
                    groupName,
                    groupSections as SectionConfig[],
                    SECTION_GROUP_CONFIGS[groupName]
                  )}
                </React.Fragment>
              )
            )}

            {/* Action Buttons - MOVED INSIDE THE FORM */}
            <div className="sticky bottom-0 bg-white border-t pt-4 flex justify-end gap-3">
              {patientInfo && (
                <PrintAssessment
                  assessmentData={removeEmpty(formData)}
                  patientInfo={patientInfo}
                  therapistId={user?.id}
                />
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !patientInfo}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Create Assessment
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
