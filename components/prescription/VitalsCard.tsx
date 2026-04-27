import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Heart,
  Weight,
  Ruler,
  Thermometer,
  Droplets,
} from "lucide-react";
import { VitalsData } from "@/types/assessment";
import { getBMIStatus } from "@/lib/utils/bmi-claculator";

interface VitalsCardProps {
  vitals: VitalsData;
}

export const VitalsCard: React.FC<VitalsCardProps> = ({ vitals }) => {
  const bmiStatus = vitals?.bmi ? getBMIStatus(vitals.bmi) : null;
  const hasVitals =
    vitals == null
      ? false
      : vitals.weight ||
        vitals.height ||
        vitals.pulse ||
        vitals.bloodPressure?.systolic ||
        vitals.temperature;

  if (!hasVitals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-red-600" />
            Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No vital signs recorded
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-red-600" />
          Vital Signs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-4">
          {vitals.bloodPressure?.systolic &&
            vitals.bloodPressure?.diastolic && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <Heart className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Blood Pressure
                  </p>
                  <p className="font-semibold text-gray-900">
                    {vitals.bloodPressure.systolic}/
                    {vitals.bloodPressure.diastolic} mmHg
                  </p>
                </div>
              </div>
            )}

          {vitals.pulse && (
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
              <Heart className="h-5 w-5 text-pink-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pulse Rate</p>
                <p className="font-semibold text-gray-900">
                  {vitals.pulse} bpm
                </p>
              </div>
            </div>
          )}

          {vitals.weight > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Weight className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Weight</p>
                <p className="font-semibold text-gray-900">
                  {vitals.weight} kg
                </p>
              </div>
            </div>
          )}

          {vitals.height > 0 && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Ruler className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Height</p>
                <p className="font-semibold text-gray-900">
                  {vitals.height} cm
                </p>
              </div>
            </div>
          )}

          {vitals.bmi > 0 && bmiStatus && (
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${bmiStatus.color}`}
            >
              <Activity className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium text-gray-600">BMI</p>
                <p className="font-semibold">{vitals.bmi} kg/m²</p>
                <p className="text-xs">{bmiStatus.status}</p>
              </div>
            </div>
          )}

          {vitals.temperature && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Thermometer className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className="font-semibold text-gray-900">
                  {vitals.temperature}°F
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
