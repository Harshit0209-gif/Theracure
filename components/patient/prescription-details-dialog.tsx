import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrescriptionDetailsView } from "@/components/prescription/PrescriptionDetailsView";

interface PrescriptionDetailsDialogProps {
  prescriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrescriptionDetailsDialog({
  prescriptionId,
  open,
  onOpenChange,
}: PrescriptionDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prescription Details</DialogTitle>
        </DialogHeader>
        {prescriptionId && (
          <PrescriptionDetailsView prescriptionId={prescriptionId} />
        )}
      </DialogContent>
    </Dialog>
  );
}
