/**
 * Timezone Utility
 * Handles conversion between UTC (database storage) and Jakarta timezone (display)
 *
 * Strategy:
 * - All dates stored in database as UTC (using Prisma's DateTime type)
 * - Convert to Jakarta time (UTC+7 / Asia/Jakarta) when displaying to users
 * - Accept Jakarta time from users and convert to UTC before saving
 */

const JAKARTA_TIMEZONE = 'Asia/Jakarta';
const JAKARTA_UTC_OFFSET = 7 * 60; // UTC+7 in minutes

export const timezoneUtil = {
  /**
   * Get Jakarta timezone identifier
   */
  getJakartaTimezone(): string {
    return JAKARTA_TIMEZONE;
  },

  /**
   * Get UTC offset for Jakarta in minutes
   */
  getJakartaOffset(): number {
    return JAKARTA_UTC_OFFSET;
  },

  /**
   * Convert UTC Date to Jakarta timezone Date object
   * Used when displaying dates from database to user
   *
   * @param utcDate - Date object in UTC (from database)
   * @returns Date object adjusted to Jakarta timezone (UTC+7)
   */
  utcToJakarta(utcDate: Date | string | null | undefined): Date | null {
    if (!utcDate) {
      return null;
    }

    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

    if (isNaN(date.getTime())) {
      return null;
    }

    // Add 7 hours to UTC time to get Jakarta time
    const jakartaDate = new Date(date.getTime() + JAKARTA_UTC_OFFSET * 60 * 1000);
    return jakartaDate;
  },

  /**
   * Convert Jakarta timezone Date to UTC
   * Used when receiving dates from user input and storing to database
   *
   * @param jakartaDate - Date object in Jakarta timezone (from user)
   * @returns Date object in UTC (for database storage)
   */
  jakartaToUtc(jakartaDate: Date | string | null | undefined): Date | null {
    if (!jakartaDate) {
      return null;
    }

    const date = typeof jakartaDate === 'string' ? new Date(jakartaDate) : jakartaDate;

    if (isNaN(date.getTime())) {
      return null;
    }

    // Subtract 7 hours from Jakarta time to get UTC
    const utcDate = new Date(date.getTime() - JAKARTA_UTC_OFFSET * 60 * 1000);
    return utcDate;
  },

  /**
   * Format date to ISO string in Jakarta timezone
   * Returns format: YYYY-MM-DDTHH:mm:ss.sssZ with Jakarta offset
   *
   * @param utcDate - Date object in UTC (from database)
   * @returns ISO string representation in Jakarta timezone
   */
  formatToJakartaISO(utcDate: Date | string | null | undefined): string | null {
    const jakartaDate = this.utcToJakarta(utcDate);

    if (!jakartaDate) {
      return null;
    }

    return jakartaDate.toISOString();
  },

  /**
   * Format date to readable string in Jakarta timezone
   * Returns format: DD/MM/YYYY HH:mm:ss
   *
   * @param utcDate - Date object in UTC (from database)
   * @returns Readable date string in Jakarta timezone
   */
  formatToJakartaReadable(utcDate: Date | string | null | undefined): string | null {
    const jakartaDate = this.utcToJakarta(utcDate);

    if (!jakartaDate) {
      return null;
    }

    const day = String(jakartaDate.getUTCDate()).padStart(2, '0');
    const month = String(jakartaDate.getUTCMonth() + 1).padStart(2, '0');
    const year = jakartaDate.getUTCFullYear();
    const hours = String(jakartaDate.getUTCHours()).padStart(2, '0');
    const minutes = String(jakartaDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(jakartaDate.getUTCSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  },

  /**
   * Format date to date-only string in Jakarta timezone
   * Returns format: DD/MM/YYYY
   *
   * @param utcDate - Date object in UTC (from database)
   * @returns Date-only string in Jakarta timezone
   */
  formatToJakartaDateOnly(utcDate: Date | string | null | undefined): string | null {
    const jakartaDate = this.utcToJakarta(utcDate);

    if (!jakartaDate) {
      return null;
    }

    const day = String(jakartaDate.getUTCDate()).padStart(2, '0');
    const month = String(jakartaDate.getUTCMonth() + 1).padStart(2, '0');
    const year = jakartaDate.getUTCFullYear();

    return `${day}/${month}/${year}`;
  },

  /**
   * Format date to time-only string in Jakarta timezone
   * Returns format: HH:mm:ss
   *
   * @param utcDate - Date object in UTC (from database)
   * @returns Time-only string in Jakarta timezone
   */
  formatToJakartaTimeOnly(utcDate: Date | string | null | undefined): string | null {
    const jakartaDate = this.utcToJakarta(utcDate);

    if (!jakartaDate) {
      return null;
    }

    const hours = String(jakartaDate.getUTCHours()).padStart(2, '0');
    const minutes = String(jakartaDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(jakartaDate.getUTCSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  },

  /**
   * Get current time in Jakarta timezone
   *
   * @returns Current Date object in Jakarta timezone
   */
  getCurrentJakartaTime(): Date {
    return this.utcToJakarta(new Date())!;
  },

  /**
   * Get current time in UTC (for database storage)
   *
   * @returns Current Date object in UTC
   */
  getCurrentUtcTime(): Date {
    return new Date();
  },

  /**
   * Convert object with date properties from UTC to Jakarta timezone
   * Useful for converting entire database records
   *
   * @param obj - Object with date properties
   * @param dateFields - Array of field names that contain dates
   * @returns New object with dates converted to Jakarta timezone
   */
  convertObjectToJakarta<T extends Record<string, any>>(
    obj: T,
    dateFields: (keyof T)[]
  ): T {
    const converted = { ...obj };

    for (const field of dateFields) {
      if (converted[field] instanceof Date || typeof converted[field] === 'string') {
        const jakartaDate = this.utcToJakarta(converted[field] as Date | string);
        converted[field] = jakartaDate as any;
      }
    }

    return converted;
  },

  /**
   * Convert object with date properties from Jakarta to UTC
   * Useful for preparing data before database insertion
   *
   * @param obj - Object with date properties in Jakarta timezone
   * @param dateFields - Array of field names that contain dates
   * @returns New object with dates converted to UTC
   */
  convertObjectToUtc<T extends Record<string, any>>(
    obj: T,
    dateFields: (keyof T)[]
  ): T {
    const converted = { ...obj };

    for (const field of dateFields) {
      if (converted[field] instanceof Date || typeof converted[field] === 'string') {
        const utcDate = this.jakartaToUtc(converted[field] as Date | string);
        converted[field] = utcDate as any;
      }
    }

    return converted;
  },
};
