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

const PrintAssessment = ({
  assessmentData,
  patientInfo,
  disabled = false,
  variant = "outline",
  size = "default",
  className = "",
  showPreview = true,
  autoDownload = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Main print function
  const handlePrint = async (options = {}) => {
    try {
      setLoading(true);

      // Validate required data
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
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate PDF");
      }

      const blob = await response.blob();

      if (autoDownload) {
        // Auto download the PDF
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        const link = document.createElement("a");
        link.href = url;
        link.download = `assessment-${completeAssessmentData.patient.id}-${
          new Date().toISOString().split("T")[0]
        }.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Assessment form has been downloaded as PDF.",
        });
      } else {
        // Open in new tab for preview/print
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      }
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

  // Print preview function
  const handlePrintPreview = () => {
    try {
      if (!patientInfo) {
        toast({
          title: "Cannot Preview",
          description: "Patient information is required for preview.",
          variant: "destructive",
        });
        return;
      }
      setShowPrintPreview(true);
    } catch (error) {
      toast({
        title: "Preview Error",
        description: "Failed to open preview.",
        variant: "destructive",
      });
    }
  };

  // Direct print without download
  const handleDirectPrint = () => {
    handlePrint({ autoDownload: false });
  };

  return (
    <>
      {/* Main Print Button */}
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={showPreview ? handlePrintPreview : handlePrint}
        disabled={disabled || loading || !patientInfo}
        className={`flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {loading
          ? "Generating..."
          : showPreview
          ? "Print Preview"
          : "Print PDF"}
      </Button>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Assessment Form Preview
              </DialogTitle>
              <DialogDescription>
                Preview of the assessment form before printing
              </DialogDescription>
            </DialogHeader>

            <div className="print-preview bg-white border rounded-lg overflow-hidden">
              {/* Header Preview */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">THERA-CURE</h1>
                    <p className="text-blue-100">
                      Advanced Physiotherapy Clinic
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>361/A, Basudevpur Road, Ground Floor</p>
                    <p>Shyamnagar, West Bengal, 743127</p>
                    <p>📞 (033) 3564 7255</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Form Title */}
                <div className="bg-blue-600 text-white text-center py-3 mb-6 rounded">
                  <h2 className="font-bold text-lg">OPD ASSESSMENT SHEET</h2>
                </div>

                {/* Patient Info Preview */}
                <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <p>
                      <strong>Name:</strong>{" "}
                      {patientInfo?.name ||
                        patientInfo?.patientName ||
                        "Not provided"}
                    </p>
                    <p>
                      <strong>Age/Gender:</strong> {patientInfo?.age || "N/A"} /{" "}
                      {patientInfo?.gender || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p>
                      <strong>Patient ID:</strong> THRC
                      {patientInfo?.id || patientInfo?.patientId || ""}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {assessmentData?.assessmentDate
                        ? new Date(
                            assessmentData.assessmentDate
                          ).toLocaleDateString("en-IN")
                        : new Date().toLocaleDateString("en-IN")}
                    </p>
                    <p>
                      <strong>Height:</strong> {assessmentData?.height || "N/A"}{" "}
                      cms
                    </p>
                    <p>
                      <strong>Weight:</strong> {assessmentData?.weight || "N/A"}{" "}
                      kgs
                    </p>
                  </div>
                </div>

                {/* Assessment Fields Preview */}
                <div className="space-y-4 text-sm">
                  {[
                    {
                      label: "Chief Complaints",
                      value: assessmentData?.chiefComplaints,
                    },
                    { label: "H/O", value: assessmentData?.historyOfIllness },
                    {
                      label: "On Observation",
                      value: assessmentData?.onObservation,
                    },
                    {
                      label: "On Palpation",
                      value: assessmentData?.onPalpation,
                    },
                    {
                      label: "On Examinations",
                      value: assessmentData?.onExaminations,
                    },
                    {
                      label: "Differential Diagnosis",
                      value: assessmentData?.differentialDiagnosis,
                    },
                    {
                      label: "Investigations",
                      value: assessmentData?.investigations,
                    },
                    {
                      label: "Special Tests",
                      value: assessmentData?.specialTests,
                    },
                    {
                      label: "Provisional Diagnosis",
                      value: assessmentData?.provisionalDiagnosis,
                    },
                    {
                      label: "Physiotherapy Management",
                      value: assessmentData?.physiotherapyMgmt,
                    },
                  ].map((field, index) => (
                    <div key={index}>
                      <strong className="text-gray-700">{field.label}:</strong>
                      <div className="border p-3 min-h-[40px] bg-white rounded mt-1">
                        {field.value || (
                          <span className="text-gray-400 italic">
                            Not provided
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Preview */}
                <div className="mt-8 p-4 bg-blue-600 text-white text-center rounded">
                  <p className="font-semibold">
                    IN CASE OF ANY EMERGENCY CONTACT THE NEAREST HOSPITAL
                    IMMEDIATELY
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowPrintPreview(false)}
              >
                Close Preview
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDirectPrint}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Open in New Tab
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download PDF
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PrintAssessment;
