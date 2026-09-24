"use client";
import { authClient } from "@/app/lib/auth-client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ResetPassword({ params }) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    document.title = "Peckodoro | Reset Password";
  }, []);

  const resetPassword = async (e) => {
    e.preventDefault();
    toast.loading("Sending reset link...", {
      id: "reset-link",
    });
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    try {
      await authClient.requestPasswordReset(
        {
          email: email,
          redirectTo: "/change-password",
        },
        {
          onError: (error) => {
            toast.error("Failed to send reset link. Please try again.");
            console.error("Error sending reset link:", error);
          },
          onSuccess: async () => {
            toast.success("If account exists, we've sent you a reset link", {
              duration: 2000,
              id: "reset-link",
            });
          },
        }
      );
    } catch (error) {
      toast.error("Error resetting password. Please try again.");
      console.error("Error resetting password:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 text-ink">
      <div className="sticker w-full max-w-md bg-shell rounded-2xl p-6 md:p-8 flex flex-col items-center">
      <span className="font-[family-name:var(--font-display)] text-lg font-bold cursor-pointer mb-1" onClick={()=>router.push("/")}>Peckodoro</span>
      <h1 className="font-[family-name:var(--font-display)] font-extrabold text-3xl mb-5">Reset your password</h1>
      <form className="flex flex-col items-center w-full">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors"
        />
        <button
          onClick={resetPassword}
          className="sticker-btn mt-2 w-full py-3 bg-beak rounded-xl font-bold cursor-pointer"
        >
          Send reset link
        </button>
      </form>
      <span
        className="mt-4 text-sm underline underline-offset-2 cursor-pointer"
        onClick={() => router.push("/login")}
      >
        Back to log in
      </span>
      </div>
    </div>
  );
}
