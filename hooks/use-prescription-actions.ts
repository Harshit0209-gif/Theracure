import { toast } from "@/components/ui/use-toast";

/**
 * Reusable hook for prescription actions (view, download)
 *
 * @example
 * ```tsx
 * import { usePrescriptionActions } from "@/hooks/use-prescription-actions";
 *
 * function MyComponent() {
 *   const { handleView, handleDownload } = usePrescriptionActions();
 *
 *   return (
 *     <button onClick={() => handleView("prescription-id")}>
 *       View Prescription
 *     </button>
 *   );
 * }
 * ```
 */
export const usePrescriptionActions = () => {
  /**
   * View prescription PDF in a new tab
   * @param prescriptionId - The ID of the prescription to view
   */
  const handleView = async (prescriptionId: string) => {
    try {
      window.open(`/api/prescriptions/${prescriptionId}/pdf`, "_blank");
    } catch (error) {
      console.error("View error:", error);
      toast({
        title: "Unable to view",
        description: "Could not open the prescription",
        variant: "destructive",
      });
    }
  };

  /**
   * Download prescription PDF
   * @param prescriptionId - The ID of the prescription to download
   */
  const handleDownload = async (prescriptionId: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Download started", description: "Downloading prescription PDF" });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Could not download the prescription",
        variant: "destructive",
      });
    }
  };

  return {
    handleView,
    handleDownload,
  };
};
