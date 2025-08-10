import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, FileText, Clock, CheckCircle } from "lucide-react";
import { PrescriptionData } from "@/types/prescription";

interface PrescriptionHeaderProps {
  prescription: PrescriptionData;
}

export const PrescriptionHeader: React.FC<PrescriptionHeaderProps> = ({
  prescription,
}) => {
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

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Assessment Details
          </h2>
          <div className="flex items-center gap-4 text-indigo-100">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {prescription.patient.patientName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(prescription.createdAt)}
            </span>
          </div>
        </div>

        <div className="text-right space-y-2">
          <Badge
            variant={prescription.session.completed ? "default" : "secondary"}
            className={`${
              prescription.session.completed
                ? "bg-green-500 hover:bg-green-600"
                : "bg-yellow-500 hover:bg-yellow-600"
            } text-white`}
          >
            {prescription.session.completed ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <Clock className="h-3 w-3 mr-1" />
            )}
            {prescription.session.completed ? "Completed" : "In Progress"}
          </Badge>
          <div className="text-sm text-indigo-100">
            ID: {prescription.id.slice(0, 8)}...
          </div>
        </div>
      </div>
    </div>
  );
};
