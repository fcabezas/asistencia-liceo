/**
 * Normalizes a Chilean mobile phone number (the only kind that can receive
 * WhatsApp messages) to E.164, e.g. "+56912345678". Returns null if the
 * input can't be confidently normalized to a 9-digit Chilean mobile number.
 */
export function normalizeChileanMobile(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");

  let national: string | null = null;

  if (digits.startsWith("569") && digits.length === 11) {
    national = digits.slice(2); // drop "56"
  } else if (digits.startsWith("9") && digits.length === 9) {
    national = digits;
  } else if (digits.length === 8) {
    national = `9${digits}`;
  }

  if (!national || !/^9\d{8}$/.test(national)) {
    return null;
  }

  return `+56${national}`;
}

export function isValidE164ChileanMobile(phone: string): boolean {
  return /^\+569\d{8}$/.test(phone);
}
