import {
  localTimeToUtc,
  utcTimeToLocal,
  isValidDomain,
  getCurrentDateUtc,
  getCurrentTimeUtc,
  getTimezoneOffset,
} from './utils';

describe('Time Conversion Utils', () => {
  describe('localTimeToUtc', () => {
    it('should convert EST (UTC-5) local time to UTC', () => {
      const result = localTimeToUtc('09:00', -300); // 9 AM EST
      expect(result).toBe('14:00'); // 2 PM UTC
    });

    it('should handle midnight correctly', () => {
      const result = localTimeToUtc('00:00', -300);
      expect(result).toBe('05:00');
    });

    it('should handle time that wraps to next day', () => {
      const result = localTimeToUtc('23:00', -300);
      expect(result).toBe('04:00'); // Next day in UTC
    });
  });

  describe('utcTimeToLocal', () => {
    it('should convert UTC to EST (UTC-5) local time', () => {
      const result = utcTimeToLocal('14:00', -300); // 2 PM UTC
      expect(result).toBe('09:00'); // 9 AM EST
    });

    it('should handle midnight correctly', () => {
      const result = utcTimeToLocal('05:00', -300);
      expect(result).toBe('00:00');
    });

    it('should handle time that wraps to previous day', () => {
      const result = utcTimeToLocal('02:00', -300);
      expect(result).toBe('21:00'); // Previous day in local
    });
  });

  describe('round trip conversions', () => {
    it('should convert back and forth correctly', () => {
      const original = '15:30';
      const offset = -300;
      const utc = localTimeToUtc(original, offset);
      const back = utcTimeToLocal(utc, offset);
      expect(back).toBe(original);
    });
  });
});

describe('Domain Validation', () => {
  describe('isValidDomain', () => {
    it('should accept valid domains', () => {
      expect(isValidDomain('google.com')).toBe(true);
      expect(isValidDomain('subdomain.example.com')).toBe(true);
      expect(isValidDomain('my-site.co.uk')).toBe(true);
    });

    it('should reject invalid domains', () => {
      expect(isValidDomain('not-a-domain')).toBe(false);
      expect(isValidDomain('http://example.com')).toBe(false);
      expect(isValidDomain('example')).toBe(false);
      expect(isValidDomain('')).toBe(false);
      expect(isValidDomain('example..com')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isValidDomain('GOOGLE.COM')).toBe(true);
      expect(isValidDomain('Google.Com')).toBe(true);
    });
  });
});

describe('Date and Time Utils', () => {
  describe('getCurrentDateUtc', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getCurrentDateUtc();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getCurrentTimeUtc', () => {
    it('should return time in HH:MM format', () => {
      const result = getCurrentTimeUtc();
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return a number', () => {
      const result = getTimezoneOffset();
      expect(typeof result).toBe('number');
    });

    it('should return offset in minutes', () => {
      const result = getTimezoneOffset();
      expect(result).toBeGreaterThanOrEqual(-720); // UTC-12
      expect(result).toBeLessThanOrEqual(840); // UTC+14
    });
  });
});
