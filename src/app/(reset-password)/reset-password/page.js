"use client";
import { authClient } from "@/app/lib/auth-client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function resetPassword({ params }) {
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
    <div className="h-screen flex flex-col justify-center items-center font-[family-name:var(--font-figtree)]">
      <span className="text-3xl mb-4 font-bold cursor-pointer" onClick={()=>router.push("/")}>Peckodoro</span>
      <span className="text-3xl mb-4">Reset Password</span>
      <form className="flex flex-col items-center w-md">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 p-2 border rounded w-3/4"
        />
        <button
          onClick={resetPassword}
          className="bg-black text-white p-2 rounded w-3/4 cursor-pointer"
        >
          Reset Password
        </button>
      </form>
      <span
        className="mt-3 cursor-pointer"
        onClick={() => router.push("/login")}
      >
        Back to Login
      </span>
    </div>
  );
}
