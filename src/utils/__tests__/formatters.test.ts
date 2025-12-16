// src/utils/__tests__/formatters.test.ts

import { formatShortDate, getOrdinal } from '../formatters';

describe('formatShortDate', () => {
  describe('when given a valid ISO date string', () => {
    it('should format January date correctly', () => {
      // Arrange
      const dateISO = '2024-01-15';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Jan 15');
    });

    it('should format December date correctly', () => {
      // Arrange
      const dateISO = '2024-12-25';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Dec 25');
    });

    it('should format middle-of-year date correctly', () => {
      // Arrange
      const dateISO = '2024-06-18';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Jun 18');
    });
  });

  describe('when given dates with single-digit days', () => {
    it('should not zero-pad single-digit days', () => {
      // Arrange
      const dateISO = '2024-03-05';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Mar 5');
    });

    it('should format the first day of the month correctly', () => {
      // Arrange
      const dateISO = '2024-07-01';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Jul 1');
    });

    it('should format February 9th correctly', () => {
      // Arrange
      const dateISO = '2024-02-09';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Feb 9');
    });
  });

  describe('when given edge case dates', () => {
    it('should format the first day of January correctly', () => {
      // Arrange
      const dateISO = '2024-01-01';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Jan 1');
    });

    it('should format the last day of December correctly', () => {
      // Arrange
      const dateISO = '2024-12-31';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Dec 31');
    });

    it('should format the last day of February in a leap year correctly', () => {
      // Arrange - 2024 is a leap year
      const dateISO = '2024-02-29';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Feb 29');
    });

    it('should format the last day of February in a non-leap year correctly', () => {
      // Arrange - 2023 is not a leap year
      const dateISO = '2023-02-28';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Feb 28');
    });

    it('should format the last day of a 30-day month correctly', () => {
      // Arrange - April has 30 days
      const dateISO = '2024-04-30';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Apr 30');
    });

    it('should format the last day of a 31-day month correctly', () => {
      // Arrange - May has 31 days
      const dateISO = '2024-05-31';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('May 31');
    });
  });

  describe('when given dates from different years', () => {
    it('should work correctly for year 2023', () => {
      // Arrange
      const dateISO = '2023-08-22';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Aug 22');
    });

    it('should work correctly for year 2025', () => {
      // Arrange
      const dateISO = '2025-11-07';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Nov 7');
    });

    it('should work correctly for year 2020', () => {
      // Arrange
      const dateISO = '2020-09-15';

      // Act
      const result = formatShortDate(dateISO);

      // Assert
      expect(result).toBe('Sep 15');
    });
  });

  describe('when testing all twelve months', () => {
    it('should format each month abbreviation correctly', () => {
      // Arrange - test one date from each month
      const testCases = [
        { input: '2024-01-10', expected: 'Jan 10' },
        { input: '2024-02-10', expected: 'Feb 10' },
        { input: '2024-03-10', expected: 'Mar 10' },
        { input: '2024-04-10', expected: 'Apr 10' },
        { input: '2024-05-10', expected: 'May 10' },
        { input: '2024-06-10', expected: 'Jun 10' },
        { input: '2024-07-10', expected: 'Jul 10' },
        { input: '2024-08-10', expected: 'Aug 10' },
        { input: '2024-09-10', expected: 'Sep 10' },
        { input: '2024-10-10', expected: 'Oct 10' },
        { input: '2024-11-10', expected: 'Nov 10' },
        { input: '2024-12-10', expected: 'Dec 10' },
      ];

      // Act & Assert
      testCases.forEach(({ input, expected }) => {
        expect(formatShortDate(input)).toBe(expected);
      });
    });
  });
});

describe('getOrdinal', () => {
  describe('when given numbers ending in 1', () => {
    it('should return "1st" for 1', () => {
      expect(getOrdinal(1)).toBe('1st');
    });

    it('should return "21st" for 21', () => {
      expect(getOrdinal(21)).toBe('21st');
    });

    it('should return "31st" for 31', () => {
      expect(getOrdinal(31)).toBe('31st');
    });

    it('should return "101st" for 101', () => {
      expect(getOrdinal(101)).toBe('101st');
    });
  });

  describe('when given numbers ending in 2', () => {
    it('should return "2nd" for 2', () => {
      expect(getOrdinal(2)).toBe('2nd');
    });

    it('should return "22nd" for 22', () => {
      expect(getOrdinal(22)).toBe('22nd');
    });

    it('should return "102nd" for 102', () => {
      expect(getOrdinal(102)).toBe('102nd');
    });
  });

  describe('when given numbers ending in 3', () => {
    it('should return "3rd" for 3', () => {
      expect(getOrdinal(3)).toBe('3rd');
    });

    it('should return "23rd" for 23', () => {
      expect(getOrdinal(23)).toBe('23rd');
    });

    it('should return "103rd" for 103', () => {
      expect(getOrdinal(103)).toBe('103rd');
    });
  });

  describe('when given numbers ending in 11, 12, or 13', () => {
    it('should return "11th" for 11', () => {
      expect(getOrdinal(11)).toBe('11th');
    });

    it('should return "12th" for 12', () => {
      expect(getOrdinal(12)).toBe('12th');
    });

    it('should return "13th" for 13', () => {
      expect(getOrdinal(13)).toBe('13th');
    });

    it('should return "111th" for 111', () => {
      expect(getOrdinal(111)).toBe('111th');
    });

    it('should return "112th" for 112', () => {
      expect(getOrdinal(112)).toBe('112th');
    });

    it('should return "113th" for 113', () => {
      expect(getOrdinal(113)).toBe('113th');
    });
  });

  describe('when given numbers ending in 4-9 or 0', () => {
    it('should return "4th" for 4', () => {
      expect(getOrdinal(4)).toBe('4th');
    });

    it('should return "5th" for 5', () => {
      expect(getOrdinal(5)).toBe('5th');
    });

    it('should return "10th" for 10', () => {
      expect(getOrdinal(10)).toBe('10th');
    });

    it('should return "20th" for 20', () => {
      expect(getOrdinal(20)).toBe('20th');
    });

    it('should return "100th" for 100', () => {
      expect(getOrdinal(100)).toBe('100th');
    });
  });
});
