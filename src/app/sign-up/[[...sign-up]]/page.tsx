"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="flex items-center justify-center mb-3">
          <Image
            src="/logo.png"
            alt="KidCoach AI"
            width={200}
            height={60}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>
        <p className="text-gray-500 text-sm">เริ่มต้นฟรี ไม่ต้องใช้บัตรเครดิต</p>
      </div>
      <SignUp
        forceRedirectUrl="/onboarding"
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
