"use client";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ChangePassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function checkPasswordStrength(password) {
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$&*]/.test(password);
    const hasTwoDigits = (password.match(/\d/g) || []).length >= 2;
    const hasThreeLower = (password.match(/[a-z]/g) || []).length >= 3;
    const longEnough = password.length >= 8;
    return (
      hasUpper && hasSpecial && hasTwoDigits && hasThreeLower && longEnough
    );
  }

  const change = async (e) => {
    toast.loading("Changing password...", {
      id: "success-change",
    });
    e.preventDefault();
    if (!email || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.", {
        id: "error-password",
        position: "bottom-right",
      });
      toast.dismiss("success-change");
      return;
    }
    if (!checkPasswordStrength(newPassword)) {
      toast.error(
        "Password must be at least 8 characters long, contain an uppercase letter, a special character, and at least two digits.",
        {
          id: "error-password",
          position: "bottom-right",
          duration: 5000,
        }
      );
       toast.dismiss("success-change");
      return;
    }
    const response = await fetch(`/api/resetPassword/${token}`);
    const json = await response.json();
    console.log("User data:", json);
    if (email !== json.email) {
      toast.error("Check your email address", {
        id: "error-email",
        position: "bottom-right",
      });
       toast.dismiss("success-change");
      return;
    }
    try {
      toast.loading("Changing password...", {
        id: "success-change",
      });
      await authClient.resetPassword(
        {
          token: token,
          newPassword: newPassword,
        },
        {
          onSuccess: async () => {
            const res = await fetch("/api/resetPassword/null", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: email,
                name: json.name,
              }),
            });
          },
        }
      );
      toast.success("Password changed successfully!", {
        id: "success-change",
        position: "bottom-right",
      });
      router.push("/login");
    } catch (error) {
      toast.error("Failed to change password. Please try again.", {
        id: "error-change",
        position: "bottom-right",
      });
      console.error("Error changing password:", error);
    }
  };

  useEffect(() => {
    document.title = "Peckodoro | Reset Password";
    if (!token) {
      router.push("/reset-password");
      return;
    }
  }, []);

  console.log("Token:", token);
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 text-ink">
      <div className="sticker w-full max-w-md bg-shell rounded-2xl p-6 md:p-8 flex flex-col items-center">
      <span
        className="font-[family-name:var(--font-display)] font-extrabold text-3xl mb-5 cursor-pointer"
        onClick={() => router.push("/")}
      >
        Choose a new password
      </span>
      <form className="flex flex-col items-center w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mb-3 w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="mb-3 w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="mb-3 w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors"
        />
        <button
          onClick={async (e) => {
            change(e);
          }}
          className="sticker-btn mt-2 w-full py-3 bg-beak rounded-xl font-bold cursor-pointer"
        >
          Change password
        </button>
      </form>
      </div>
    </div>
  );
}
