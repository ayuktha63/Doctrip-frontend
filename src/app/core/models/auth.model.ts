/**
 * REST contract: POST /api/auth/register, POST /api/auth/otp/verify, POST /api/auth/otp/resend,
 * POST /api/auth/login, POST /api/auth/login/otp, POST /api/auth/token/refresh,
 * POST /api/auth/logout, GET /api/patients/me.
 * Adjust these interfaces here if the real backend shape differs — this is the single place
 * auth request/response shapes are defined. Cross-check against Doctrip-backend's
 * `dto/` package (same field names) if these ever drift.
 */

export type OtpPurpose = 'REGISTER' | 'LOGIN';

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  status: 'pending_verification' | 'active';
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  agreeToTerms: boolean;
}

export interface OtpChallengeResponse {
  patientId: string;
  otpChannel: string;
  otpTarget: string;
  otpValiditySeconds: number;
}

export interface OtpVerifyRequest {
  patientId: string;
  purpose: OtpPurpose;
  otp: string;
}

export interface OtpResendRequest {
  patientId: string;
  purpose: OtpPurpose;
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface LoginOtpRequest {
  loginId: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  patient: Patient;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}
