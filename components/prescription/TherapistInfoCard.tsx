import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, GraduationCap, Mail } from "lucide-react";
import { PrescriptionData } from "@/types/prescription";

interface TherapistInfoCardProps {
  therapist: PrescriptionData["therapist"];
}

export const TherapistInfoCard: React.FC<TherapistInfoCardProps> = ({
  therapist,
}) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Stethoscope className="h-5 w-5 text-green-600" />
          Therapist Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Name:</span>
            <span className="font-semibold text-gray-900">
              {therapist.user.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email:
            </span>
            <span className="text-gray-900 text-sm">
              {therapist.user.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              Specialization:
            </span>
            <span className="text-gray-900 text-sm text-right">
              {therapist.specialization}
            </span>
          </div>
          {therapist.qualification && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Qualification:
              </span>
              <span className="text-gray-900 text-sm text-right">
                {therapist.qualification}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
