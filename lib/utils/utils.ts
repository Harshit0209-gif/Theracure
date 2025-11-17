import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getGreeting = () => {
  const now = new Date();
  const istTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const hour = istTime.getHours();

  if (hour >= 4 && hour < 6) return "Early Morning";
  if (hour >= 6 && hour < 8) return "Good Morning";
  if (hour >= 8 && hour < 12) return "Good Day";
  if (hour >= 12 && hour < 13) return "Good Noon";
  if (hour >= 13 && hour < 16) return "Good Afternoon";
  if (hour >= 16 && hour < 18) return "Good Evening";
  if (hour >= 18 && hour < 20) return "Good Night";
  if (hour >= 20 && hour < 23) return "Night";
  return "Late Night";
};

export const generatePatientId = () => {
  const prefix = "THRC";
  const now = Date.now().toString();
  console.log("Current timestamp:", now);
  const slice = now.slice(-4);
  console.log("Last 4 digits of timestamp:", slice);
  return `${prefix}${slice}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatTimeString = (timeString: string) => {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const isPM = hour >= 12;
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${isPM ? "PM" : "AM"}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getDayName = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", { weekday: "long" });
};
