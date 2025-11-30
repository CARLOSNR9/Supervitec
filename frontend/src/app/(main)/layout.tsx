// frontend/src/app/(main)/layout.tsx

"use client";

import "@/app/globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/navbar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
      <Navbar />
      {children}
      <Toaster richColors position="top-right" />
    </div>
  );
}
