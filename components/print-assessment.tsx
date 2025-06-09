"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Printer, Eye, Download, Loader2 } from "lucide-react";

interface PatientInfo {
  id: string;
  name?: string;
  patientName?: string;
  age?: number;
  gender?: string;
  patientId?: string;
}

interface AssessmentData {
  assessmentDate?: string;
  chiefComplaints?: string;
  historyOfIllness?: string;
  onObservation?: string;
  onPalpation?: string;
  onExaminations?: string;
  differentialDiagnosis?: string;
  investigations?: string;
  specialTests?: string;
  provisionalDiagnosis?: string;
  physiotherapyMgmt?: string;
}

interface PrintAssessmentProps {
  assessmentData: AssessmentData;
  patientInfo: PatientInfo;
  therapistId?: string;
  disabled?: boolean;
  variant?: string;
  size?: string;
  className?: string;
  showPreview?: boolean;
}

const PrintAssessment = ({
  assessmentData,
  patientInfo,
  therapistId,
}: PrintAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const handlePrint = async (options = {}) => {
    try {
      setLoading(true);

      if (!patientInfo) {
        toast({
          title: "Cannot Print",
          description: "Patient information is required for printing.",
          variant: "destructive",
        });
        return;
      }

      // Call PDF generation API
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assessmentData,
          patientInfo,
          therapistId,
          type: "assessment",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate PDF");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Print Error",
        description:
          (error instanceof Error ? error.message : String(error)) ||
          "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handlePrint}
        disabled={!patientInfo}
        className={`flex items-center gap-2 `}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {loading ? "Generating..." : "Print PDF"}
      </Button>
    </>
  );
};

export default PrintAssessment;
