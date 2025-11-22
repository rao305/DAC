"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Sparkles } from "lucide-react";
import { WorkspaceLoader } from "@/components/ui/workspace-loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // In development/demo mode, allow access without authentication
  const isDemoMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Show loading spinner while checking auth state (only if not demo mode)
  if (loading && !isDemoMode) {
    return <WorkspaceLoader />;
  }

  // If not authenticated and not in demo mode, show sign-in prompt
  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050608] to-[#0a0d12] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">
              Sign in to access your conversations
            </h1>
            <p className="text-slate-400">
              Save your chats, sync your context, and run multi-LLM workflows
              across all your devices.
            </p>
          </div>

          <button
            onClick={() => router.push("/auth/sign-in")}
            className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition"
          >
            Sign In
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full px-6 py-3 border border-[#1f2937] text-slate-300 hover:bg-[#050b16] font-medium rounded-xl transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}
