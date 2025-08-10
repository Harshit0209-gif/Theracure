interface AvailablePeriod {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
  duration?: number;
}

interface TherapistSchedule {
  startTime: string;
  endTime: string;
  weekDay: number;
}

interface ExistingAppointment {
  appointmentStartTime: Date;
  appointmentEndTime: Date;
  status: string;
}

export function generateAvailablePeriods(
  therapistSchedule: TherapistSchedule[],
  existingAppointments: ExistingAppointment[],
  date: string
): AvailablePeriod[] {
  const periods: AvailablePeriod[] = [];

  console.log("Therapist Schedule:", therapistSchedule);
  console.log("Existing Appointments:", existingAppointments);
  console.log("Date:", date, "periods: ", periods);

  therapistSchedule.forEach((schedule) => {
    // Convert appointment times to time strings for comparison
    const appointmentsInPeriod = existingAppointments
      .map((apt) => ({
        startTime: apt.appointmentStartTime.toTimeString().slice(0, 5),
        endTime: apt.appointmentEndTime.toTimeString().slice(0, 5),
        status: apt.status,
      }))
      .filter(
        (apt) =>
          // Appointment overlaps with this schedule period
          apt.startTime < schedule.endTime && apt.endTime > schedule.startTime
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (appointmentsInPeriod.length === 0) {
      // No appointments in this period - entire period is available
      periods.push({
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        available: true,
        duration: calculateDuration(schedule.startTime, schedule.endTime),
      });
    } else {
      // Split period around appointments
      let currentStart = schedule.startTime;

      appointmentsInPeriod.forEach((appointment) => {
        // Add available period before appointment (if any)
        if (currentStart < appointment.startTime) {
          periods.push({
            startTime: currentStart,
            endTime: appointment.startTime,
            available: true,
            duration: calculateDuration(currentStart, appointment.startTime),
          });
        }

        // Add blocked period (appointment)
        periods.push({
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          available: false,
          reason: `Appointment (${appointment.status})`,
          duration: calculateDuration(
            appointment.startTime,
            appointment.endTime
          ),
        });

        currentStart = appointment.endTime;
      });

      // Add remaining available period after last appointment (if any)
      if (currentStart < schedule.endTime) {
        periods.push({
          startTime: currentStart,
          endTime: schedule.endTime,
          available: true,
          duration: calculateDuration(currentStart, schedule.endTime),
        });
      }
    }
  });

  return periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function generateStartTimes(
  availablePeriods: AvailablePeriod[]
): string[] {
  const startTimes: string[] = [];

  availablePeriods
    .filter((period) => period.available && period.duration! >= 15) // At least 15 minutes
    .forEach((period) => {
      const start = new Date(`2000-01-01T${period.startTime}:00`);
      const end = new Date(`2000-01-01T${period.endTime}:00`);

      // Generate 15-minute intervals
      let current = new Date(start);
      while (current.getTime() < end.getTime() - 15 * 60000) {
        // Leave at least 15 minutes
        const timeString = current.toTimeString().slice(0, 5);
        startTimes.push(timeString);
        current = new Date(current.getTime() + 15 * 60000);
      }
    });

  return [...new Set(startTimes)].sort();
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}
