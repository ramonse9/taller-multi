export const GENERIC_NATIONAL_RFC = 'XAXX010101000';
export const GENERIC_FOREIGN_RFC = 'XEXX010101000';

export const GENERIC_RFCS = new Set<string>([GENERIC_NATIONAL_RFC, GENERIC_FOREIGN_RFC]);

export const RFC_PATTERN =
  /^[A-ZÑ&]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{2}[0-9A]$/;
export const PERSON_RFC_PATTERN =
  /^[A-ZÑ&]{4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{2}[0-9A]$/;
export const COMPANY_RFC_PATTERN =
  /^[A-ZÑ&]{3}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{2}[0-9A]$/;
