"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import {
  Home,
  TrendingUp,
  Calendar,
  Gamepad2,
  BarChart3,
  BookOpen,
  Bot,
  Users,
  Settings,
  Crown,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "หน้าหลัก" },
  { href: "/dashboard/assessment", icon: TrendingUp, label: "พัฒนาการ" },
  { href: "/dashboard/plan", icon: Calendar, label: "แผนการฝึก" },
  { href: "/dashboard/activities", icon: Gamepad2, label: "กิจกรรม" },
  { href: "/dashboard/progress", icon: BarChart3, label: "ติดตามผล" },
  { href: "/dashboard/knowledge", icon: BookOpen, label: "คลังความรู้" },
  { href: "/dashboard/ai-coach", icon: Bot, label: "AI Coach" },
  { href: "/dashboard/community", icon: Users, label: "ชุมชนผู้ปกครอง" },
  { href: "/dashboard/settings", icon: Settings, label: "ตั้งค่า" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center"
          onClick={onClose}
        >
          <Image
            src="/logo.png"
            alt="KidCoach AI"
            width={140}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400"
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Banner */}
      <div className="m-3 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-medium text-gray-600">อัปเกรดเป็น</span>
        </div>
        <p className="text-sm font-bold text-amber-600 mb-1.5 flex items-center gap-1">
          <Crown className="w-4 h-4 text-amber-500" />
          Premium{" "}
          <Sparkles className="w-3 h-3 text-amber-400" />
        </p>
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          เข้าถึงทุกฟีเจอร์ ไม่จำกัด
        </p>
        <Link href="/dashboard/settings?tab=billing">
          <Button
            size="sm"
            className="w-full text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 rounded-xl h-8 font-bold"
          >
            อัปเกรดเลย
          </Button>
        </Link>
      </div>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="text-xs text-gray-500 min-w-0">
            <div className="font-semibold text-gray-700 truncate">คุณแม่ก้อย</div>
            <div className="truncate text-gray-400">Free Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (slide-in) */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden lg:flex w-56 min-h-screen bg-white border-r border-gray-100 flex-col shadow-sm shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
