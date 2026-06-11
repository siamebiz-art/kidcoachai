"use client";

import { useUser } from "@clerk/nextjs";
import type {
  UserMetadata,
  ChildProfile,
  ParentProfile,
  AssessmentResult,
  WeeklyPlan,
  Milestone,
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
    await user?.update({ unsafeMetadata: { ...metadata, latestAssessment: result } });
  }

  async function saveWeeklyPlan(plan: WeeklyPlan) {
    await user?.update({ unsafeMetadata: { ...metadata, weeklyPlan: plan } });
  }

  async function toggleActivity(key: string) {
    const updated = { ...activityLog, [key]: !activityLog[key] };
    await user?.update({ unsafeMetadata: { ...metadata, activityLog: updated } });
  }

  async function addMilestone(data: Milestone) {
    const next = [...milestones, data].slice(-20); // keep last 20
    await user?.update({ unsafeMetadata: { ...metadata, milestones: next } });
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
    weeklyPlan,
    activityLog,
    milestones,
    bookmarkedArticles,
    updateChildProfile,
    updateParentProfile,
    saveAssessment,
    saveWeeklyPlan,
    toggleActivity,
    addMilestone,
    toggleBookmark,
  };
}
