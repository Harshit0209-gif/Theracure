import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Patient } from "@/types/patient";

interface PatientInfoSectionProps {
  patientInfo: Patient;
  patientFound: boolean;
  onIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  patientInfo,
  patientFound,
  onIdChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-600" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="id">Patient ID *</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="id"
              value={patientInfo.id}
              onChange={onIdChange}
              placeholder="e.g., THRC258"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Patient details will be auto-fetched from database
          </p>
        </div>

        {/* Mock Patient Display - Shows found/not found states */}
        {patientInfo.id && (
          <>
            {/* Patient Found State */}
            {patientFound ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">
                    Patient Found
                  </span>
                </div>

                {/* Name */}
                <div>
                  <Label className="text-xs">Name</Label>
                  <div className="relative mt-0.5">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={patientInfo.patientName}
                      readOnly
                      className="pl-10 bg-gray-50 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                {patientInfo.email && (
                  <div>
                    <Label className="text-xs">Email</Label>
                    <div className="relative mt-0.5">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={patientInfo.email}
                        readOnly
                        className="pl-10 bg-gray-50 h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Phone */}
                {patientInfo.phone && (
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <div className="relative mt-0.5">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={patientInfo.phone}
                        readOnly
                        className="pl-10 bg-gray-50 h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Address */}
                <div>
                  <Label className="text-xs">Address</Label>
                  <div className="relative mt-0.5">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={patientInfo.address}
                      readOnly
                      className="pl-10 bg-gray-50 h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Patient Not Found State */
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">
                      Patient Not Found
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      No patient found with ID: {patientInfo.id}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p>Please check the patient ID or:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-500">
                    <li>Verify the ID format (e.g., PT-0258)</li>
                    <li>Create a new patient record</li>
                    <li>Search in archived patients</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
