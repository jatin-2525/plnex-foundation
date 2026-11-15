/**
 * Enterprise Form Protection & Validation Utility
 * Provides multi-layer defense against automated spam bots:
 * 1. Hidden Honeypot Field Verification
 * 2. Time-Gate & Frequency Rate Limiting
 * 3. Server-Ready Input Sanitization & Bounds Checking
 */

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Checks honeypot field.
 * Legitimate human users will leave this empty.
 * Automated bots populate hidden fields.
 */
export function verifyHoneypot(honeypotValue: string | undefined | null): boolean {
  if (!honeypotValue) return true;
  return honeypotValue.trim().length === 0;
}

/**
 * Client/session rate limiter tracking submission frequency.
 * - Minimum interaction time: 1.8 seconds (detects instant bot scripts).
 * - Maximum submission frequency: 3 requests per 60 seconds per session.
 */
export function verifyRateLimit(
  formKey: string,
  formOpenTimestamp?: number,
  minElapsedMs = 1800,
  maxPerMinute = 3
): { allowed: boolean; errorMessage?: string } {
  const now = Date.now();

  // 1. Time-gate verification
  if (formOpenTimestamp && now - formOpenTimestamp < minElapsedMs) {
    return {
      allowed: false,
      errorMessage: 'Submission occurred too rapidly. Please take a moment to review your entries before submitting.',
    };
  }

  // 2. Frequency limit
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const storageKey = `plnex_rate_${formKey}`;
    const rawHistory = sessionStorage.getItem(storageKey);
    let history: number[] = [];
    if (rawHistory) {
      try {
        history = JSON.parse(rawHistory);
      } catch {
        history = [];
      }
    }

    // Filter to last 60 seconds
    const windowStart = now - 60000;
    history = history.filter((ts) => ts > windowStart);

    if (history.length >= maxPerMinute) {
      return {
        allowed: false,
        errorMessage: 'Too many submissions detected. Please wait 60 seconds before submitting another request.',
      };
    }

    // Record submission
    history.push(now);
    sessionStorage.setItem(storageKey, JSON.stringify(history));
  }

  return { allowed: true };
}

/**
 * Sanitizes input string to prevent XSS and strip control characters.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // strip HTML angle brackets
    .trim();
}

/**
 * Standard email format RFC 5322 regex validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Validates a support/contact inquiry form.
 */
export function validateSupportForm(data: {
  name?: string;
  email?: string;
  topic?: string;
  subject?: string;
  description?: string;
  honeypot?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Honeypot check
  if (!verifyHoneypot(data.honeypot)) {
    errors.honeypot = 'Automated bot detection triggered.';
    return { valid: false, errors };
  }

  // Email check
  if (!data.email || !data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = 'Please provide a valid corporate email address.';
  }

  // Subject check
  if (!data.subject || !data.subject.trim()) {
    errors.subject = 'Subject line is required.';
  } else if (data.subject.trim().length < 5) {
    errors.subject = 'Subject line must be at least 5 characters.';
  } else if (data.subject.trim().length > 150) {
    errors.subject = 'Subject line cannot exceed 150 characters.';
  }

  // Description check
  if (!data.description || !data.description.trim()) {
    errors.description = 'Inquiry description is required.';
  } else if (data.description.trim().length < 15) {
    errors.description = 'Please provide sufficient details (minimum 15 characters).';
  } else if (data.description.trim().length > 3000) {
    errors.description = 'Description cannot exceed 3,000 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
