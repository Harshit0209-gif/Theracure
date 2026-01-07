import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Printer,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Activity,
  Stethoscope,
  Brain,
  Target,
  CheckCircle,
  Clock,
  Hash,
  Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { PrescriptionData } from "@/types/prescription";
import { AssessmentFormData } from "@/types/assessment";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";
import PrintAssessment from "../assessment/print-assessment";

interface PrescriptionDetailsViewProps {
  prescriptionId: string;
}

export const PrescriptionDetailsView: React.FC<
  PrescriptionDetailsViewProps
> = ({ prescriptionId }) => {
  const [prescription, setPrescription] = useState<PrescriptionData | null>(
    null
  );
  const [assessmentData, setAssessmentData] =
    useState<AssessmentFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptionDetails();
  }, [prescriptionId]);

  const fetchPrescriptionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/prescriptions/${prescriptionId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch prescription details");
      }

      const data = await response.json();

      if (data.success) {
        setPrescription(data.prescription);

        if (data.prescription.session?.sessionData) {
          const parsedAssessmentData: AssessmentFormData = JSON.parse(
            data.prescription.session.sessionData
          );
          setAssessmentData(parsedAssessmentData);
        }
      } else {
        throw new Error("API returned error");
      }
    } catch (error) {
      console.error("Error fetching prescription details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch prescription details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);

      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-${prescription?.patient?.patientName || prescriptionId}-${new Date().toLocaleDateString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderAssessmentField = (
    label: string,
    value: any,
    isObject = false
  ) => {
    if (isObject) {
      const hasData =
        value &&
        Object.values(value).some((v: any) => {
          if (typeof v === "string") return v.trim() !== "";
          if (typeof v === "number") return v !== 0;
          return v !== null && v !== undefined;
        });

      if (!hasData) return null;

      return (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">{label}</h4>
          <div className="space-y-2 pl-4 border-l-2 border-gray-100">
            {Object.entries(value).map(([key, val]: [string, any]) => {
              if (
                !val ||
                (typeof val === "string" && val.trim() === "") ||
                (typeof val === "number" && val === 0)
              )
                return null;

              return (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}:
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {typeof val === "number" ? val : val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      if (!value || (typeof value === "string" && value.trim() === ""))
        return null;

      return (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">{label}</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {value}
          </p>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
        <span className="ml-3 text-gray-600">
          Loading assessment details...
        </span>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center p-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Assessment not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Simple Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            Prescription ID: {prescription.id}
          </span>
          <h1 className="text-2xl font-semibold text-gray-900">
            Patient Assessment
          </h1>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(prescription.createdAt)}
            </span>
            <Badge
              variant={prescription.session.completed ? "default" : "secondary"}
            >
              {prescription.session.completed ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {prescription.session.completed ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading || loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
          {assessmentData && prescription.patient && (
            <PrintAssessment
              assessmentData={assessmentData}
              patientInfo={{
                id: prescription.patient.id,
                patientName: prescription.patient.patientName,
                age: prescription.patient.age,
                gender: prescription.patient.gender,
                phone: prescription.patient.phone || "",
                email: prescription.patient.email || "",
                createdBy: prescription.therapistId,
                createdAt: prescription.createdAt,
                updatedAt: prescription.updatedAt,
              }}
              therapistId={prescription.therapistId}
            />
          )}
        </div>
      </div>

      {/* Patient & Therapist Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name</span>
                <p className="font-medium">
                  {prescription.patient.patientName}
                </p>
              </div>
              <div>
                <span className="text-gray-600">ID</span>
                <p className="font-medium">{prescription.patient.id}</p>
              </div>
              <div>
                <span className="text-gray-600">Age</span>
                <p className="font-medium">{prescription.patient.age} years</p>
              </div>
              <div>
                <span className="text-gray-600">Gender</span>
                <p className="font-medium capitalize">
                  {prescription.patient.gender}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{prescription.patient.phone}</span>
              </div>
              {prescription.patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{prescription.patient.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              Therapist Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Name</span>
              <p className="font-medium">{prescription.therapist.user.name}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Specialization</span>
              <p className="text-sm">{prescription.therapist.specialization}</p>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{prescription.therapist.user.email}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Content */}
      {assessmentData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Clinical Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vitals */}
            {assessmentData.vitals &&
              (assessmentData.vitals.weight > 0 ||
                assessmentData.vitals.height > 0 ||
                assessmentData.vitals.pulse ||
                assessmentData.vitals.bloodPressure?.systolic) && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-500" />
                    Vital Signs
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {assessmentData.vitals.bloodPressure?.systolic && (
                      <div>
                        <span className="text-gray-600">BP</span>
                        <p className="font-medium">
                          {assessmentData.vitals.bloodPressure.systolic}/
                          {assessmentData.vitals.bloodPressure.diastolic} mmHg
                        </p>
                      </div>
                    )}
                    {assessmentData.vitals.pulse && (
                      <div>
                        <span className="text-gray-600">Pulse</span>
                        <p className="font-medium">
                          {assessmentData.vitals.pulse} bpm
                        </p>
                      </div>
                    )}
                    {assessmentData.vitals.weight > 0 && (
                      <div>
                        <span className="text-gray-600">Weight</span>
                        <p className="font-medium">
                          {assessmentData.vitals.weight} kg
                        </p>
                      </div>
                    )}
                    {assessmentData.vitals.height > 0 && (
                      <div>
                        <span className="text-gray-600">Height</span>
                        <p className="font-medium">
                          {assessmentData.vitals.height} cm
                        </p>
                      </div>
                    )}

                    {assessmentData.vitals.weight > 0 &&
                      assessmentData.vitals.height > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-sm text-gray-700">
                                BMI:
                              </span>
                              <div className="flex items-center gap-3 mt-1">
                                {(() => {
                                  const bmiResult = calculateSimpleBMI(
                                    assessmentData.vitals?.weight || 0,
                                    assessmentData.vitals?.height || 0
                                  );
                                  if (!bmiResult) return null;

                                  return (
                                    <>
                                      <span className="text-sm font-medium text-gray-900">
                                        {bmiResult.bmi} kg/cm²
                                      </span>
                                      <Badge
                                        className="border-0 font-medium text-white"
                                        style={{
                                          backgroundColor: bmiResult.color,
                                        }}
                                      >
                                        {bmiResult.status}
                                      </Badge>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

            <Separator />

            {/* Assessment Fields */}
            <div className="space-y-6">
              {renderAssessmentField(
                "Chief Complaints",
                assessmentData.chiefComplaints
              )}
              {renderAssessmentField(
                "History of Present Illness",
                assessmentData.historyOfIllness
              )}
              {renderAssessmentField(
                "Medical History",
                assessmentData.medicalHistory
              )}
              {renderAssessmentField(
                "Pain History",
                assessmentData.painHistory,
                true
              )}
              {renderAssessmentField(
                "On Observation",
                assessmentData.onObservation,
                true
              )}
              {renderAssessmentField(
                "On Palpation",
                assessmentData.onPalpation
              )}
              {renderAssessmentField(
                "Motor Examination",
                assessmentData.motorExamination,
                true
              )}
              {renderAssessmentField(
                "Neurological Examination",
                assessmentData.neurologicalExam,
                true
              )}
              {renderAssessmentField(
                "Special Tests",
                assessmentData.specialTests
              )}
              {renderAssessmentField(
                "Investigations",
                assessmentData.investigations
              )}
              {renderAssessmentField(
                "Differential Diagnosis",
                assessmentData.differentialDiagnosis
              )}
              {renderAssessmentField(
                "Provisional Diagnosis",
                assessmentData.provisionalDiagnosis
              )}
              {renderAssessmentField(
                "Physiotherapy Management",
                assessmentData.physiotherapyMgmt
              )}
              {renderAssessmentField("Additional Notes", assessmentData.notes)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Session ID: {prescription.sessionId}</span>
            <span>
              Status:
              <span
                className={`ml-1 font-medium ${
                  prescription.session.completed
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {prescription.session.completed ? "Completed" : "In Progress"}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
