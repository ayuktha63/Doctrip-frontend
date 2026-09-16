import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mirrors Doctrip-backend's PasswordPolicy.isValid exactly: 8+ chars, upper, lower, digit, special char. */
export const strongPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: string = control.value ?? '';
  if (!value) return null; // let `required` own the empty case
  const valid =
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value);
  return valid ? null : { strongPassword: true };
};

/** Mirrors Doctrip-backend's RegisterRequest.mobile pattern: exactly 10 digits. */
export const mobileNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: string = control.value ?? '';
  if (!value) return null;
  return /^[0-9]{10}$/.test(value) ? null : { mobileNumber: true };
};

/** 0-3 strength score for the visual meter — calibrated to the same policy strongPasswordValidator enforces. */
export function passwordStrengthScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) && score === 2) score++;
  return score;
}
