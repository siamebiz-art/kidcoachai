"use client";

import { useUser } from "@clerk/nextjs";
import type {
  UserMetadata,
  ChildProfile,
  ParentProfile,
  AssessmentResult,
  WeeklyPlan,
  Milestone,
  KidoSettings,
  PendingPayment,
} from "@/lib/types";
import { calculateAge } from "@/lib/profile-utils";

export function useProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const metadata = (user?.unsafeMetadata ?? {}) as UserMetadata;

  const childProfile = metadata.childProfile;
  const parentProfile = metadata.parentProfile;
  const latestAssessment = metadata.latestAssessment;
  const weeklyPlan = metadata.weeklyPlan;
  const activityLog = metadata.activityLog ?? {};

  const childAge = childProfile?.birthdate ? calculateAge(childProfile.birthdate) : "";
  const milestones = metadata.milestones ?? [];
  const bookmarkedArticles = metadata.bookmarkedArticles ?? [];
  const assessmentHistory = metadata.assessmentHistory ?? [];
  const familyPhotoUrl = metadata.familyPhotoUrl;
  const subscriptionTier = metadata.subscriptionTier ?? "free";
  const isPremium = subscriptionTier === "premium" || subscriptionTier === "pro";
  const kidoSettings: KidoSettings = metadata.kidoSettings ?? { dailyLimitMinutes: 0 };
  const pendingPayment: PendingPayment | undefined = metadata.pendingPayment;

  const displayName =
    parentProfile?.displayName ||
    (user?.firstName ? `คุณ${user.firstName}` : "คุณผู้ปกครอง");

  async function updateChildProfile(data: ChildProfile) {
    await user?.update({ unsafeMetadata: { ...metadata, childProfile: data } });
  }

  async function updateParentProfile(data: ParentProfile) {
    await user?.update({ unsafeMetadata: { ...metadata, parentProfile: data } });
  }

  async function saveAssessment(result: AssessmentResult) {
    const history = [...assessmentHistory, result].slice(-12); // keep last 12
    await user?.update({
      unsafeMetadata: {
        ...metadata,
        latestAssessment: result,
        assessmentHistory: history,
      },
    });
  }

  async function saveWeeklyPlan(plan: WeeklyPlan) {
    await user?.update({ unsafeMetadata: { ...metadata, weeklyPlan: plan } });
  }

  async function saveAssessmentAndPlan(result: AssessmentResult, plan: WeeklyPlan) {
    const history = [...assessmentHistory, result].slice(-12);
    await user?.update({
      unsafeMetadata: {
        ...metadata,
        latestAssessment: result,
        assessmentHistory: history,
        weeklyPlan: plan,
      },
    });
  }

  async function toggleActivity(key: string) {
    const updated = { ...activityLog, [key]: !activityLog[key] };
    await user?.update({ unsafeMetadata: { ...metadata, activityLog: updated } });
  }

  async function addMilestone(data: Milestone) {
    const next = [...milestones, data].slice(-20); // keep last 20
    await user?.update({ unsafeMetadata: { ...metadata, milestones: next } });
  }

  async function updateFamilyPhoto(url: string) {
    await user?.update({ unsafeMetadata: { ...metadata, familyPhotoUrl: url } });
  }

  async function updateKidoSettings(data: KidoSettings) {
    await user?.update({ unsafeMetadata: { ...metadata, kidoSettings: data } });
  }

  async function toggleBookmark(articleId: number) {
    const next = bookmarkedArticles.includes(articleId)
      ? bookmarkedArticles.filter((id) => id !== articleId)
      : [...bookmarkedArticles, articleId];
    await user?.update({ unsafeMetadata: { ...metadata, bookmarkedArticles: next } });
  }

  return {
    isLoaded,
    isSignedIn,
    user,
    childProfile,
    childAge,
    parentProfile,
    displayName,
    latestAssessment,
    assessmentHistory,
    weeklyPlan,
    activityLog,
    milestones,
    bookmarkedArticles,
    subscriptionTier,
    isPremium,
    familyPhotoUrl,
    kidoSettings,
    updateChildProfile,
    pendingPayment,
    updateKidoSettings,
    updateParentProfile,
    updateFamilyPhoto,
    saveAssessment,
    saveWeeklyPlan,
    saveAssessmentAndPlan,
    toggleActivity,
    addMilestone,
    toggleBookmark,
  };
}
