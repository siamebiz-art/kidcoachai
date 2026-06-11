export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type ScoreKey = "ภาษา" | "การสื่อสาร" | "การเรียนรู้" | "สมาธิ" | "กล้ามเนื้อ";

export interface AssessmentScores {
  ภาษา: number;
  การสื่อสาร: number;
  การเรียนรู้: number;
  สมาธิ: number;
  กล้ามเนื้อ: number;
}

export interface ChildProfile {
  name: string;
  birthdate: string;
  gender: "ชาย" | "หญิง" | "";
  diagnosisKey: string;
  diagnosisLabel: string;
  avatar?: string;
}

export interface ParentProfile {
  displayName: string;
  phone?: string;
}

export interface AssessmentResult {
  date: string;
  childName: string;
  childAge: string;
  scores: AssessmentScores;
  overall: number;
}

export interface PlanActivity {
  time: "เช้า" | "บ่าย" | "เย็น";
  activity: string;
  duration: string;
  category: string;
  description: string;
  tips: string;
}

export interface WeeklyPlan {
  generatedAt: string;
  childName: string;
  monday: PlanActivity[];
  tuesday: PlanActivity[];
  wednesday: PlanActivity[];
  thursday: PlanActivity[];
  friday: PlanActivity[];
  saturday: PlanActivity[];
  sunday: PlanActivity[];
  aiNote: string;
}

export interface Milestone {
  date: string;
  event: string;
  category: string;
}

export interface UserMetadata {
  childProfile?: ChildProfile;
  parentProfile?: ParentProfile;
  latestAssessment?: AssessmentResult;
  assessmentHistory?: AssessmentResult[];
  weeklyPlan?: WeeklyPlan;
  activityLog?: Record<string, boolean>;
  milestones?: Milestone[];
  bookmarkedArticles?: number[];
  // Subscription
  subscriptionTier?: "free" | "premium" | "pro";
  subscriptionStatus?: "active" | "trialing" | "past_due" | "canceled";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // Usage
  aiChatCount?: number;
  aiChatResetDate?: string;
}
