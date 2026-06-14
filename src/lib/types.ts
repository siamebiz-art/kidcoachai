export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface KidoSettings {
  dailyLimitMinutes: number; // 0 = unlimited
}
export type GameResult = { score: number; total: number };

export interface GameSession {
  gameId: string;
  gameName: string;
  date: string;          // "YYYY-MM-DD"
  score: number;
  total: number;
  accuracy: number;      // 0-100
  ts: number;            // epoch ms
}
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
  avatarUrl?: string;
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
  // Usage counters (daily unless noted)
  aiChatCount?: number;
  aiChatResetDate?: string;
  kidoChatCount?: number;
  kidoChatResetDate?: string;
  planGenCount?: number;       // monthly
  planGenResetDate?: string;   // "YYYY-MM"
  kidoRecCount?: number;
  kidoRecResetDate?: string;
  kidoStoryCount?: number;
  kidoStoryResetDate?: string;
  kidoEqCount?: number;
  kidoEqResetDate?: string;
  kidoHomeworkCount?: number;
  kidoHomeworkResetDate?: string;
  kidoCreativeCount?: number;
  kidoCreativeResetDate?: string;
  kidoSettings?: KidoSettings;
  familyPhotoUrl?: string;
  // Game sessions history
  gameSessions?: GameSession[];
  // PromptPay payment
  pendingPayment?: PendingPayment;
}

export interface AiSlipCheck {
  valid: boolean;
  amount: number;
  amountMatch: boolean;
  bank: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  checkedAt: string;
}

export interface PendingPayment {
  tier: "premium" | "pro";
  amount: number;
  slipUrl: string;
  ref: string;
  submittedAt: string;
  status: "pending" | "ai_approved" | "approved" | "rejected";
  rejectedReason?: string;
  aiCheck?: AiSlipCheck;
}
