interface SimpleBMIResult {
  bmi: number;
  status: string;
  color: string;
}

export function calculateSimpleBMI(
  weight: number,
  height: number
): SimpleBMIResult {
  if (height === 0 || weight === 0) {
    return null as any;
  }

  const heightInMeters = height / 100;

  const bmi = parseFloat(
    (weight / (heightInMeters * heightInMeters)).toFixed(1)
  );

  let status: string;
  let color: string;

  if (bmi < 18.5) {
    status = "Underweight";
    color = "#f97316";
  } else if (bmi >= 18.5 && bmi < 25.0) {
    status = "Normal";
    color = "#16a34a";
  } else if (bmi >= 25.0 && bmi < 30.0) {
    status = "Overweight";
    color = "#eab308";
  } else {
    status = "Obese";
    color = "#dc2626";
  }

  return { bmi, status, color };
}

export const getBMIStatus = (bmi: number) => {
  if (bmi < 18.5)
    return { status: "Underweight", color: "text-orange-600 bg-orange-50" };
  if (bmi < 25)
    return { status: "Normal", color: "text-green-600 bg-green-50" };
  if (bmi < 30)
    return { status: "Overweight", color: "text-yellow-600 bg-yellow-50" };
  return { status: "Obese", color: "text-red-600 bg-red-50" };
};
