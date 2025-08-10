import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PrescriptionData } from "@/types/prescription";

interface PatientInfoCardProps {
  patient: PrescriptionData["patient"];
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  patient,
}) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-600" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <span className="font-semibold text-gray-900">
                {patient.patientName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Patient ID:
              </span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {patient.id}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Age:</span>
              <span className="text-gray-900">{patient.age} years</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Gender:</span>
              <span className="text-gray-900">
                {patient.gender === "M" ? "Male" : "Female"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone:
              </span>
              <span className="text-gray-900">{patient.phone}</span>
            </div>
            {patient.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email:
                </span>
                <span className="text-gray-900 text-sm">{patient.email}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
