"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Zap, Shield } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export default function SignInPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already signed in
  useEffect(() => {
    if (user && !loading) {
      router.push("/conversations");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      await signInWithGoogle();
      // Redirect happens via useEffect above
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in. Please try again.");
      setIsSigningIn(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050608] to-[#0a0d12] flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050608] to-[#0a0d12] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-gradient-to-b from-[#0a0d12] to-[#050608] border border-[#1f2937] rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              Sign in to Syntra
            </h1>
            <p className="text-slate-400 text-sm">
              Save your chats, sync your context, and run multi-LLM workflows
              across all your devices.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-200 font-medium">
                  Store and resume conversations
                </p>
                <p className="text-xs text-slate-500">
                  Never lose your chat history
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-200 font-medium">
                  Share one context window across models
                </p>
                <p className="text-xs text-slate-500">
                  Seamless multi-LLM conversations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-purple-400" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-200 font-medium">
                  Access multi-LLM routing history
                </p>
                <p className="text-xs text-slate-500">
                  See which models were used and why
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-xl flex items-center justify-center gap-3 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              By signing in, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
