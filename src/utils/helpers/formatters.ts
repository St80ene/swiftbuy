import { Transform } from 'class-transformer';

type UserValue = { value: string | number | boolean | null | undefined };

/**
 * Trims leading/trailing whitespace and collapses
 * consecutive whitespace characters into a single space.
 *
 * Example:
 * "  John    Doe  " → "John Doe"
 */
export const NormalizeString = () =>
  Transform(({ value }: UserValue) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  );

/**
 * Trims leading/trailing whitespace and converts
 * the value to lowercase.
 *
 * Example:
 * "  JOHN@EXAMPLE.COM  " → "john@example.com"
 */
export const NormalizeEmail = () =>
  Transform(({ value }: UserValue) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

/**
 * Trims leading/trailing whitespace and converts
 * the value to lowercase.
 *
 * Example:
 * "  Electronics  " → "electronics"
 */
export const ToLowerCase = () =>
  Transform(({ value }: UserValue) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

/**
 * Trims leading/trailing whitespace and converts
 * the value to uppercase.
 *
 * Example:
 * "  ngn  " → "NGN"
 */
export const ToUpperCase = () =>
  Transform(({ value }: UserValue) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  );

/**
 * Trims leading/trailing whitespace without
 * modifying internal whitespace.
 *
 * Example:
 * "  Electronics  " → "Electronics"
 */
export const TrimString = () =>
  Transform(({ value }: UserValue) =>
    typeof value === 'string' ? value.trim() : value,
  );
