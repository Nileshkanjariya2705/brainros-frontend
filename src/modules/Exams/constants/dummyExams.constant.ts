export interface DummyExamTemplate {
  id: string;
  title: string;
  target: 'JEE' | 'NEET' | 'CET' | 'FOUNDATION';
  targetBadge: string;
  description: string;
  subjects: string[];
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  difficulty: 'Standard NTA' | 'Moderate' | 'Advanced' | 'Mastery';
  languages: string[];
  enrolledCount: string;
  rating: number;
  tag: string;
  isFree: boolean;
  features: string[];
}

export const DUMMY_EXAMS: DummyExamTemplate[] = [
  {
    id: 'exam-jee-main-01',
    title: 'JEE Main 2026 — All India Full Syllabus Grand Mock Test 01',
    target: 'JEE',
    targetBadge: 'JEE Main',
    description:
      'Exact NTA standard full length test with Section A (20 MCQs) and Section B (Numerical with negative marking) across Physics, Chemistry, and Mathematics.',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    durationMinutes: 180,
    totalMarks: 300,
    totalQuestions: 75,
    difficulty: 'Standard NTA',
    languages: ['English', 'हिंदी', 'मराठी', 'ગુજરાતી'],
    enrolledCount: '18,420 Aspirants',
    rating: 4.9,
    tag: 'NTA Standard 2026',
    isFree: true,
    features: ['Instant Percentile Ranking', 'AI Speed vs Accuracy Diagnostic', 'In-Flight Language Switch'],
  },
  {
    id: 'exam-neet-ug-01',
    title: 'NEET UG 2026 — All India Comprehensive Grand Mock Simulation',
    target: 'NEET',
    targetBadge: 'NEET UG',
    description:
      'Full syllabus mock exam with 200 questions (attempt 180) across Physics, Chemistry, and Biology (Botany & Zoology). Instant chapter accuracy breakdown.',
    subjects: ['Physics', 'Chemistry', 'Biology (Botany + Zoology)'],
    durationMinutes: 200,
    totalMarks: 720,
    totalQuestions: 180,
    difficulty: 'Standard NTA',
    languages: ['English', 'हिंदी', 'मराठी', 'தமிழ்', 'తెలుగు'],
    enrolledCount: '26,890 Aspirants',
    rating: 4.9,
    tag: 'All India Rank Engine',
    isFree: true,
    features: ['NCERT Page References', 'Negative Mark Optimization', 'Multi-Language Support'],
  },
  {
    id: 'exam-cet-pcm-01',
    title: 'MHT-CET 2026 — Engineering Stream (PCM) Full Syllabus Mock',
    target: 'CET',
    targetBadge: 'MHT-CET',
    description:
      'State CET pattern simulation for Engineering aspirants with 50 questions each in Physics, Chemistry, and Mathematics (2 marks each for Math).',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    durationMinutes: 180,
    totalMarks: 200,
    totalQuestions: 150,
    difficulty: 'Moderate',
    languages: ['English', 'मराठी'],
    enrolledCount: '12,650 Aspirants',
    rating: 4.8,
    tag: 'State Rank Predictor',
    isFree: true,
    features: ['No Negative Marking Pattern', 'State Board Aligned Questions', 'Instant Cutoff Insights'],
  },
  {
    id: 'exam-neet-bio-special',
    title: 'NEET 2026 — High-Yield Biology 360/360 Target Sprint Test',
    target: 'NEET',
    targetBadge: 'NEET Biology',
    description:
      'Curated high-weightage test targeting Genetics, Ecology, Human Physiology, and Biotechnology with Assertion-Reason and Match-The-Following types.',
    subjects: ['Botany', 'Zoology'],
    durationMinutes: 90,
    totalMarks: 360,
    totalQuestions: 90,
    difficulty: 'Advanced',
    languages: ['English', 'हिंदी', 'मराठी'],
    enrolledCount: '15,310 Aspirants',
    rating: 4.9,
    tag: 'High Yield Sprint',
    isFree: true,
    features: ['Assertion-Reason Focus', 'Diagram-based Questions', 'Detailed NCERT Solutions'],
  },
  {
    id: 'exam-jee-adv-01',
    title: 'JEE Advanced 2026 — Multi-Correct & Numerical Rigor Paper 1',
    target: 'JEE',
    targetBadge: 'JEE Advanced',
    description:
      'Challenging problem sets featuring Multiple Correct Options with partial marking, Matrix Match, and Integer Numerical response questions.',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    durationMinutes: 180,
    totalMarks: 180,
    totalQuestions: 54,
    difficulty: 'Mastery',
    languages: ['English', 'हिंदी'],
    enrolledCount: '8,940 Aspirants',
    rating: 4.9,
    tag: 'IIT Aspirant Level',
    isFree: true,
    features: ['Partial Marking Engine', 'Multi-Concept Problems', 'Step-by-Step Solutions'],
  },
  {
    id: 'exam-cet-pcb-01',
    title: 'MHT-CET 2026 — Pharmacy & Agriculture Stream (PCB) Mock Test',
    target: 'CET',
    targetBadge: 'MHT-CET PCB',
    description:
      'Standard 200-mark assessment for Pharmacy and Agri-tech admissions covering Physics, Chemistry, and Biology aligned with state textbook syllabus.',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    durationMinutes: 180,
    totalMarks: 200,
    totalQuestions: 200,
    difficulty: 'Moderate',
    languages: ['English', 'मराठी'],
    enrolledCount: '11,180 Aspirants',
    rating: 4.8,
    tag: 'Pharmacy Stream Spec',
    isFree: true,
    features: ['State Merit Rank Estimator', 'Topic-wise Speed Breakdown', 'Full Solution Explanations'],
  },
  {
    id: 'exam-jee-physics-01',
    title: 'JEE Main 2026 — Mechanics & Electrodynamics Subject Diagnostic',
    target: 'JEE',
    targetBadge: 'JEE Physics',
    description:
      'Subject-focused diagnostic assessment on Kinematics, Laws of Motion, Rotational Dynamics, Electrostatics, and Current Electricity.',
    subjects: ['Physics'],
    durationMinutes: 60,
    totalMarks: 100,
    totalQuestions: 25,
    difficulty: 'Advanced',
    languages: ['English', 'हिंदी', 'मराठी'],
    enrolledCount: '9,820 Aspirants',
    rating: 4.8,
    tag: 'Subject Master',
    isFree: true,
    features: ['Concept Level Weakness Mapping', 'Time Management Scorecard', 'Formula Sheet Included'],
  },
  {
    id: 'exam-foundation-01',
    title: 'Class 11 & 12 Foundation — Pre-JEE/NEET Integrated Diagnostic',
    target: 'FOUNDATION',
    targetBadge: 'Foundation',
    description:
      'Bridging school curriculum with competitive exam problem-solving skills. Ideal for high school students beginning entrance preparation.',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    durationMinutes: 120,
    totalMarks: 200,
    totalQuestions: 60,
    difficulty: 'Moderate',
    languages: ['English', 'हिंदी', 'मराठी', 'ગુજરાતી'],
    enrolledCount: '7,450 Students',
    rating: 4.7,
    tag: 'Early Starter',
    isFree: true,
    features: ['Foundational Aptitude Metrics', 'Interactive AI Solutions', 'Parent Performance Report'],
  },
];
