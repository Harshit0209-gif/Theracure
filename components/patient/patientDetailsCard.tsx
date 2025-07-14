import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2 } from "lucide-react";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";
import { Patient } from "@/types/patient";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/generated/userRoles";

// Clean Info Display Component
const InfoDisplay = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-base font-medium text-gray-900">{value}</p>
  </div>
);

export const PatientDetailsCard = ({
  patient,
  onEdit,
  onDelete,
}: {
  patient: Patient;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}) => {
  const bmiResult = calculateSimpleBMI(
    patient.weight || 0,
    patient.height || 0
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const { user } = useAuth();
  const isTherapist = user?.role === UserRole.THERAPIST;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl text-gray-900">
              {patient.patientName}
            </CardTitle>
            <Badge variant="secondary" className="w-fit">
              ID: {patient.id}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(patient)}
              className="gap-2"
              variant="outline"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
            {!isTherapist && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the patient
                      <span className="font-medium">
                        {" "}
                        {patient.patientName}
                      </span>{" "}
                      and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(patient)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Patient
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoDisplay label="Age" value={`${patient.age} years`} />
            <InfoDisplay
              label="Gender"
              value={
                <Badge variant="outline" className="capitalize">
                  {patient.gender}
                </Badge>
              }
            />
            <InfoDisplay
              label="Status"
              value={
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              }
            />
          </div>
        </div>

        {/* Physical Measurements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Physical Measurements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoDisplay
              label="Height"
              value={patient.height ? `${patient.height} cm` : "Not specified"}
            />
            <InfoDisplay
              label="Weight"
              value={patient.weight ? `${patient.weight} kg` : "Not specified"}
            />
            {/* BMI Calculation */}
            {patient.height && patient.weight && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">BMI:</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const bmiData = calculateSimpleBMI(
                      patient.weight,
                      patient.height
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

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoDisplay
              label="Phone"
              value={patient.phone || "Not provided"}
            />
            <InfoDisplay
              label="Email"
              value={patient.email || "Not provided"}
            />
            <div className="md:col-span-2">
              <InfoDisplay
                label="Address"
                value={patient.address || "Not provided"}
              />
            </div>
          </div>
        </div>

        {/* Medical Information */}
        {patient.medicalHistory && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Medical History
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {patient.medicalHistory}
              </p>
            </div>
          </div>
        )}

        {/* Registration Information */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-900">
            Registration Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoDisplay
              label="Created"
              value={formatDate(patient.createdAt)}
            />
            <InfoDisplay
              label="Last Updated"
              value={formatDate(patient.updatedAt)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
