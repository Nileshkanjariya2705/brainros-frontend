export interface District {
  id: string;
  name: string;
  code?: string | null;
}

export interface State {
  id: string;
  name: string;
  code?: string | null;
  districts?: District[];
}

export interface StudentProfile {
  id: string;
  studentId: string;
  studentCode?: string;
  name: string;
  state: string;
  district: string;
  schoolCollege: string;
  class?: string;
  examTarget?: string;
  preferredLanguage?: string;
  classId?: string;
  examTargetId?: string;
  preferredLanguageId?: string;
  stateId?: string;
  districtId?: string;
  status?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
}

export interface User {
  id: string;
  phone?: string | null;
  mobileNumber?: string | null;
  email: string | null;
  status?: string;
  isActive: boolean;
  isVerified: boolean;
  roles: string[];
  permissions?: string[];
  activeRole?: string | null;
  institution?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  lastLoginAt?: string | null;
  studentProfile?: StudentProfile | null;
  student?: StudentProfile | null;
}

export interface AuthSession {
  id: string;
  deviceId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  lastActivityAt?: string;
  expiresAt?: string;
  createdAt?: string;
  isCurrent?: boolean;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user: User;
  session?: {
    sessionId: string;
  };
  student?: {
    id: string;
    studentId: string;
    studentCode?: string;
    name: string;
  };
}

export type LoginResponse = AuthData;

export interface RegisterStudentResponse {
  user: User;
  student: {
    id: string;
    studentId: string;
    studentCode?: string;
    name: string;
    state?: string;
    district?: string;
    schoolCollege?: string;
  };
  session?: {
    sessionId: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  roles: string[];
  permissions: string[];
  activeRole: string | null;
}

export interface SendOtpDto {
  phone: string;
  purpose?:
    | 'LOGIN'
    | 'REGISTER'
    | 'CHANGE_MOBILE'
    | 'RESET_PASSWORD'
    | 'VERIFY_MOBILE'
    | 'VERIFY_EMAIL';
}

export interface VerifyOtpDto {
  mobileNumber: string;
  otp: string;
  purpose?: string;
}

export interface LoginEmailDto {
  email: string;
  password: string;
}

export interface LoginStudentIdDto {
  studentId: string;
  password: string;
}

export interface GoogleLoginDto {
  idToken: string;
}

export interface RegisterStudentDto {
  phone: string;
  name: string;
  email?: string;
  password?: string;
  state?: string;
  district?: string;
  stateId?: string;
  districtId?: string;
  schoolCollege: string;
  classId: string;
  preferredLanguageId: string;
  examTargetId: string;
}

export interface OptionItem {
  id: string;
  name: string;
  code?: string;
}

export interface RegisterOptionsResponse {
  classes: OptionItem[];
  languages: OptionItem[];
  examTargets: OptionItem[];
  states?: State[];
}
