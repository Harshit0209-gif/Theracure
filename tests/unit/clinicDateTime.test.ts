import { describe, expect, it } from "vitest";
import {
  formatTimeInClinicTimeZone,
  getClinicDayBounds,
  getClinicWeekDayFromDate,
  getClinicWeekDayFromDateTime,
} from "@/lib/utils/clinicDateTime";
import { generateAvailablePeriods } from "@/lib/utils/AppointmentAvailableTimeSlotGenerator";

describe("clinicDateTime helpers", () => {
  it("keeps weekday calculation pinned to Asia/Kolkata for date-only input", () => {
    expect(getClinicWeekDayFromDate("2026-04-10")).toBe(5);
  });

  it("formats appointment times in Asia/Kolkata instead of server local time", () => {
    expect(
      formatTimeInClinicTimeZone(new Date("2026-04-10T04:30:00.000Z"))
    ).toBe("10:00");
  });

  it("returns IST day bounds in UTC storage time", () => {
    const { startOfDay, endOfDay } = getClinicDayBounds("2026-04-10");

    expect(startOfDay.toISOString()).toBe("2026-04-09T18:30:00.000Z");
    expect(endOfDay.toISOString()).toBe("2026-04-10T18:29:59.999Z");
  });

  it("derives weekday from a stored UTC appointment using clinic timezone", () => {
    expect(
      getClinicWeekDayFromDateTime(new Date("2026-04-10T04:30:00.000Z"))
    ).toBe(5);
  });
});

describe("generateAvailablePeriods", () => {
  it("splits therapist schedule around overlapping bookings in clinic time", () => {
    const periods = generateAvailablePeriods(
      [{ weekDay: 5, startTime: "09:00", endTime: "13:00" }],
      [
        {
          appointmentStartTime: new Date("2026-04-10T04:30:00.000Z"),
          appointmentEndTime: new Date("2026-04-10T05:00:00.000Z"),
          status: "CONFIRMED",
        },
      ]
    );

    expect(periods).toEqual([
      {
        startTime: "09:00",
        endTime: "10:00",
        available: true,
        duration: 60,
      },
      {
        startTime: "10:00",
        endTime: "10:30",
        available: false,
        reason: "Appointment (CONFIRMED)",
        duration: 30,
      },
      {
        startTime: "10:30",
        endTime: "13:00",
        available: true,
        duration: 150,
      },
    ]);
  });
});
