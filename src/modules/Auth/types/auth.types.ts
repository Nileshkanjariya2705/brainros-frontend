export interface User {
  id: string;
  phone: string;
  mobileNumber: string;
  email: string | null;
  isActive: boolean;
  isVerified: boolean;
  roles: string[];
  studentProfile?: {
    id: string;
    studentId: string;
    name: string;
    state: string;
    district: string;
    schoolCollege: string;
    class: string;
    examTarget: string;
    preferredLanguage: string;
  } | null;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type LoginResponse = AuthData;

export interface RegisterStudentResponse {
  user: User;
  student: {
    id: string;
    studentId: string;
    name: string;
    state: string;
    district: string;
    schoolCollege: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface SendOtpDto {
  mobileNumber: string;
}

export interface VerifyOtpDto {
  mobileNumber: string;
  otp: string;
}

export interface RegisterStudentDto {
  phone: string;
  name: string;
  email?: string;
  state: string;
  district: string;
  schoolCollege: string;
  classId: string;
  preferredLanguageId: string;
  examTargetId: string;
}

export interface OptionItem {
  id: string;
  name: string;
}

export interface RegisterOptionsResponse {
  classes: OptionItem[];
  languages: OptionItem[];
  examTargets: OptionItem[];
}
