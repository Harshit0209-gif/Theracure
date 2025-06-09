interface SimpleBMIResult {
  bmi: number;
  status: string;
  color: string;
}

export function calculateSimpleBMI(
  weight: number,
  height: number
): SimpleBMIResult {
  // Convert height from cm to meters
  const heightInMeters = height / 100;

  // Calculate BMI
  const bmi = parseFloat(
    (weight / (heightInMeters * heightInMeters)).toFixed(1)
  );

  // Determine status and color
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
