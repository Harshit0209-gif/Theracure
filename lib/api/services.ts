import { CreateService, Service } from "@/types/service";

export async function getServices(): Promise<Service[]> {
  const response = await fetch("/api/services");
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch services");
  }

  return data.data as Service[];
}

export async function createService(data: CreateService) {
  const res = await fetch("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create service");
  return res.json();
}
