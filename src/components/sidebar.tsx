"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import Image from "next/image";
import { useProfile } from "@/hooks/use-profile";
import {
  Home, TrendingUp, Calendar, Gamepad2, BarChart3,
  BookOpen, Bot, Users, Settings, Crown, Sparkles, X, Camera, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard",             icon: Home,       label: "หน้าหลัก",        color: "text-blue-600",   bg: "bg-blue-100"   },
  { href: "/dashboard/assessment",  icon: TrendingUp, label: "พัฒนาการ",        color: "text-purple-600", bg: "bg-purple-100" },
  { href: "/dashboard/plan",        icon: Calendar,   label: "แผนการฝึก",       color: "text-teal-600",   bg: "bg-teal-100"   },
  { href: "/dashboard/activities",  icon: Gamepad2,   label: "กิจกรรม",         color: "text-orange-600", bg: "bg-orange-100" },
  { href: "/dashboard/progress",    icon: BarChart3,  label: "ติดตามผล",        color: "text-indigo-600", bg: "bg-indigo-100" },
  { href: "/dashboard/knowledge",   icon: BookOpen,   label: "คลังความรู้",     color: "text-amber-600",  bg: "bg-amber-100"  },
  { href: "/dashboard/ai-coach",    icon: Bot,        label: "AI Coach",         color: "text-violet-600", bg: "bg-violet-100" },
  { href: "/dashboard/community",   icon: Users,      label: "ชุมชนผู้ปกครอง", color: "text-pink-600",   bg: "bg-pink-100"   },
  { href: "/dashboard/settings",    icon: Settings,   label: "ตั้งค่า",          color: "text-gray-500",   bg: "bg-gray-100"   },
];

function FamilyPhoto() {
  return (
    <div className="mx-3 mb-2 shrink-0 relative group">
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 via-sky-50 to-purple-100 flex items-center justify-center py-3 px-2">
        <div className="relative">
          <Image
            src="/family.png"
            alt="ครอบครัว"
            width={140}
            height={90}
            className="rounded-xl object-cover w-full h-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const el = document.getElementById("family-emoji-fallback");
              if (el) el.style.display = "flex";
            }}
          />
          <div id="family-emoji-fallback"
            className="hidden items-end justify-center gap-1 py-2 select-none">
            <span className="text-4xl">👨</span>
            <span className="text-3xl mb-1">👧</span>
            <span className="text-4xl">👩</span>
          </div>
        </div>
      </div>
      <Link href="/dashboard/settings">
        <button className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-gray-100 items-center justify-center hidden group-hover:flex transition-all hover:bg-white">
          <Camera className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </Link>
    </div>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { displayName } = useProfile();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center" onClick={onClose}>
          <Image src="/logo.png" alt="KidCoach AI" width={140} height={40}
            className="h-10 w-auto object-contain" priority />
        </Link>
        {onClose && (
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}>
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    isActive ? "bg-blue-100" : item.bg
                  )}>
                    <item.icon className={cn("w-4 h-4", isActive ? "text-blue-600" : item.color)} />
                  </div>
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Upgrade banner */}
        <div className="mx-3 mb-2">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl px-3 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-600">Premium</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <span className="text-[9px] text-gray-400">ไม่จำกัด</span>
            </div>
            <Link href="/dashboard/settings?tab=billing" onClick={onClose}>
              <Button size="sm"
                className="w-full text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 rounded-xl h-7 font-bold shadow-sm">
                อัปเกรดเลย
              </Button>
            </Link>
          </div>
        </div>

        {/* User info */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
            <UserButton />
            <div className="text-xs text-gray-500 min-w-0">
              <div className="font-semibold text-gray-700 truncate">{displayName}</div>
              <div className="truncate text-gray-400">Free Plan</div>
            </div>
          </div>
        </div>

        <FamilyPhoto />

        {/* Sign out */}
        <div className="px-3 pb-3">
          <SignOutButton>
            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-colors border border-red-100">
              <LogOut className="w-3.5 h-3.5" />
              ออกจากระบบ
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-gray-100 flex-col shadow-sm shrink-0 overflow-hidden">
        <SidebarContent />
      </aside>
    </>
  );
}
