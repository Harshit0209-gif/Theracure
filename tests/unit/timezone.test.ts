import { describe, it, expect } from 'vitest';

describe('Timezone Conversion', () => {
  it('should convert UTC time to IST correctly', () => {
    // Simulate the appointment time scenario
    const utcTimeString = '2026-01-20T06:07:00.000Z';
    const utcDate = new Date(utcTimeString);

    // Convert to IST using toLocaleTimeString
    const istTimeString = utcDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

    // Expected: 06:07 UTC + 5:30 = 11:37 IST
    expect(istTimeString).toBe('11:37');
  });

  it('should match therapist availability slot after timezone conversion', () => {
    // Simulated therapist slot: 09:00 - 13:00 IST
    const therapistStart = '09:00';
    const therapistEnd = '13:00';

    // Appointment time: 11:37 - 12:39 IST (converted from UTC)
    const utcStart = new Date('2026-01-20T06:07:00.000Z');
    const utcEnd = new Date('2026-01-20T07:09:00.000Z');

    const istStart = utcStart.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

    const istEnd = utcEnd.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

    // Verify appointment falls within therapist slot
    expect(therapistStart <= istStart).toBe(true);
    expect(therapistEnd >= istEnd).toBe(true);

    // Verify the actual times
    expect(istStart).toBe('11:37');
    expect(istEnd).toBe('12:39');
  });

  it('should fail appointment outside therapist hours', () => {
    const therapistStart = '09:00';
    const therapistEnd = '13:00';

    // Appointment at 14:00 - 15:00 IST (outside hours)
    const utcStart = new Date('2026-01-20T08:30:00.000Z'); // 14:00 IST
    const istStart = utcStart.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

    expect(istStart).toBe('14:00');
    expect(therapistStart <= istStart && therapistEnd >= istStart).toBe(false);
  });

  it('should handle edge case at slot boundary', () => {
    const therapistStart = '09:00';
    const therapistEnd = '13:00';

    // Appointment exactly at start time
    const utcStartBoundary = new Date('2026-01-20T03:30:00.000Z'); // 09:00 IST
    const istStartBoundary = utcStartBoundary.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

    expect(istStartBoundary).toBe('09:00');
    expect(therapistStart <= istStartBoundary).toBe(true);

    // Appointment exactly at end time
    const utcEndBoundary = new Date('2026-01-20T07:30:00.000Z'); // 13:00 IST
    const istEndBoundary = utcEndBoundary.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

    expect(istEndBoundary).toBe('13:00');
    expect(therapistEnd >= istEndBoundary).toBe(true);
  });
});
