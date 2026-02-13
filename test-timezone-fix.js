// Test to verify timezone conversion fix

console.log('🧪 Testing Timezone Conversion Fix\n');

// Simulate the issue
const appointmentStartTimeUTC = '2026-01-20T06:07:00.000Z'; // UTC time from frontend
const appointmentEndTimeUTC = '2026-01-20T07:09:00.000Z';

const startTime = new Date(appointmentStartTimeUTC);
const endTime = new Date(appointmentEndTimeUTC);

console.log('=== INPUT (from frontend) ===');
console.log('Start Time (UTC):', appointmentStartTimeUTC);
console.log('End Time (UTC):', appointmentEndTimeUTC);
console.log('');

console.log('=== OLD METHOD (BROKEN) ===');
const oldStartTimeStr = startTime.toTimeString().slice(0, 5);
const oldEndTimeStr = endTime.toTimeString().slice(0, 5);
console.log('Extracted Start Time (Server TZ):', oldStartTimeStr);
console.log('Extracted End Time (Server TZ):', oldEndTimeStr);
console.log('');

console.log('=== NEW METHOD (FIXED) ===');
const newStartTimeStr = startTime.toLocaleTimeString('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Kolkata'
});
const newEndTimeStr = endTime.toLocaleTimeString('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Kolkata'
});
console.log('Extracted Start Time (IST):', newStartTimeStr);
console.log('Extracted End Time (IST):', newEndTimeStr);
console.log('');

console.log('=== COMPARISON WITH THERAPIST SLOT ===');
const therapistStartTime = '09:00';
const therapistEndTime = '13:00';
console.log('Therapist Slot:', `${therapistStartTime} - ${therapistEndTime}`);
console.log('');

console.log('Old Method Check:');
console.log(`  ${therapistStartTime} <= ${oldStartTimeStr} ? ${therapistStartTime <= oldStartTimeStr}`);
console.log(`  ${therapistEndTime} >= ${oldEndTimeStr} ? ${therapistEndTime >= oldEndTimeStr}`);
console.log(`  Result: ${therapistStartTime <= oldStartTimeStr && therapistEndTime >= oldEndTimeStr ? '✅ PASS' : '❌ FAIL'}`);
console.log('');

console.log('New Method Check:');
console.log(`  ${therapistStartTime} <= ${newStartTimeStr} ? ${therapistStartTime <= newStartTimeStr}`);
console.log(`  ${therapistEndTime} >= ${newEndTimeStr} ? ${therapistEndTime >= newEndTimeStr}`);
console.log(`  Result: ${therapistStartTime <= newStartTimeStr && therapistEndTime >= newEndTimeStr ? '✅ PASS' : '❌ FAIL'}`);
console.log('');

console.log('=== SUMMARY ===');
if (therapistStartTime <= newStartTimeStr && therapistEndTime >= newEndTimeStr) {
  console.log('✅ Fix successful! Appointment time (11:37-12:39 IST) is now correctly');
  console.log('   recognized as falling within therapist slot (09:00-13:00 IST)');
} else {
  console.log('❌ Fix failed. Please check timezone configuration.');
}
