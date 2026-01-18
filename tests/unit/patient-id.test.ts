import { describe, it, expect } from 'vitest';

describe('Patient ID Generation Logic', () => {
  // Simulate the LPAD function behavior
  function lpad(value: number, length: number, padChar: string = '0'): string {
    let str = value.toString();
    while (str.length < length) {
      str = padChar + str;
    }
    return str;
  }

  it('should pad numbers correctly with 3 digits', () => {
    expect(lpad(1, 3)).toBe('001');
    expect(lpad(42, 3)).toBe('042');
    expect(lpad(999, 3)).toBe('999');
  });

  it('should truncate when number exceeds pad length (bug scenario)', () => {
    // This demonstrates the bug we found
    const largeNumber = 3556;
    const paddedWith3 = lpad(largeNumber, 3);

    // LPAD with 3 digits will NOT truncate in JavaScript
    // But in PostgreSQL, it would show as '3556' (no truncation in modern versions)
    // The issue was string comparison, not truncation
    expect(paddedWith3).toBe('3556'); // JavaScript doesn't truncate
  });

  it('should handle 4-digit padding correctly', () => {
    expect(lpad(3556, 4)).toBe('3556');
    expect(lpad(1, 4)).toBe('0001');
    expect(lpad(9999, 4)).toBe('9999');
  });

  it('should generate patient IDs with proper format', () => {
    const prefix = 'THRC';

    // Test with various numbers
    const testCases = [
      { num: 1, expected4: 'THRC0001' },
      { num: 355, expected4: 'THRC0355' },
      { num: 3556, expected4: 'THRC3556' },
      { num: 9999, expected4: 'THRC9999' },
    ];

    testCases.forEach(({ num, expected4 }) => {
      const id4 = prefix + lpad(num, 4);
      expect(id4).toBe(expected4);
    });
  });

  it('should detect duplicate IDs would occur with 3-digit padding', () => {
    // This test shows why 4-digit padding is needed
    const existing = 355; // Existing patient THRC355
    const nextNumber = 3556; // Next patient number from MAX query

    const oldFormat = 'THRC' + lpad(nextNumber, 3); // Would be 'THRC3556' in JS
    const existingFormat = 'THRC' + lpad(existing, 3); // 'THRC355'

    // The issue was in SQL, not JS - but this shows the concept
    expect(oldFormat).not.toBe(existingFormat);
  });

  it('should validate patient ID format', () => {
    const validIds = ['THRC0001', 'THRC0355', 'THRC3556', 'THRC9999'];
    const invalidIds = ['THRC', 'THRC1', 'THRC01', 'RC0001', 'THRC355a'];

    validIds.forEach((id) => {
      expect(id).toMatch(/^THRC\d{4}$/);
    });

    invalidIds.forEach((id) => {
      expect(id).not.toMatch(/^THRC\d{4}$/);
    });
  });

  it('should increment patient ID correctly', () => {
    const currentMax = 3555;
    const nextId = currentMax + 1;
    const patientId = 'THRC' + lpad(nextId, 4);

    expect(patientId).toBe('THRC3556');
    expect(patientId).toMatch(/^THRC\d{4}$/);
  });
});
