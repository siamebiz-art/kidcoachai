"use client";

import { SignUp } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="flex items-center gap-2 justify-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            KidCoach AI
          </span>
        </Link>
        <p className="text-gray-500 text-sm">เริ่มต้นฟรี ไม่ต้องใช้บัตรเครดิต</p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-xl border border-purple-100 rounded-2xl",
            headerTitle: "text-gray-900 font-bold",
            formButtonPrimary:
              "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
            footerActionLink: "text-purple-600 hover:text-purple-700",
          },
        }}
      />
    </div>
  );
}
