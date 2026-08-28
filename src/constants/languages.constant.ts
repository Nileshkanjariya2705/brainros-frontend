export type SupportedExamLanguageCode =
  | 'en'
  | 'kn'
  | 'hi'
  | 'ta'
  | 'te'
  | 'mr'
  | 'ml'
  | 'bn'
  | 'gu';

export interface SupportedExamLanguage {
  code: SupportedExamLanguageCode;
  name: string;
  nativeName: string;
  displayOrder: number;
}

export const MANDATORY_LANGUAGE_CODES: SupportedExamLanguageCode[] = [
  'en',
  'kn',
  'hi',
  'ta',
  'te',
  'mr',
  'ml',
  'bn',
  'gu',
];

export const SUPPORTED_EXAM_LANGUAGES: SupportedExamLanguage[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    displayOrder: 1,
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    displayOrder: 2,
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    displayOrder: 3,
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    displayOrder: 4,
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    displayOrder: 5,
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    displayOrder: 6,
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    displayOrder: 7,
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    displayOrder: 8,
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    displayOrder: 9,
  },
];
