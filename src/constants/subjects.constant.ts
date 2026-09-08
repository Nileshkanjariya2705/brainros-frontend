/**
 * Academic Subjects & Target Exam Constants
 * Restricts question authoring and filters to core subjects for JEE and NEET.
 */

export const TARGET_EXAMS = ['JEE', 'NEET'] as const;

export const ALLOWED_CORE_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'] as const;

export type AllowedCoreSubject = (typeof ALLOWED_CORE_SUBJECTS)[number];

export const isAllowedSubject = (subjectName?: string): boolean => {
  if (!subjectName) return false;
  const lower = subjectName.toLowerCase();
  return (
    lower.includes('physics') ||
    lower.includes('chemistry') ||
    lower.includes('math') ||
    lower.includes('bio') ||
    lower.includes('botany') ||
    lower.includes('zoology')
  );
};

/**
 * Formats or cleans subject name for display if necessary
 */
export const formatSubjectDisplayName = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('physics')) return 'Physics';
  if (lower.includes('chemistry')) return 'Chemistry';
  if (lower.includes('math')) return 'Mathematics';
  if (lower.includes('botany')) return 'Biology (Botany)';
  if (lower.includes('zoology')) return 'Biology (Zoology)';
  if (lower.includes('bio')) return 'Biology';
  return name;
};
