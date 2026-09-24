"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSession,
  signIn,
  signUp, // alias of authClient.signIn
  signOut, // available but not used here
} from "@/app/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  toast.dismiss();
  const { data: session } = useSession();
  const router = useRouter();

  // already signed in? send to dashboard
  useEffect(() => {
    if (session) router.replace("/");
  }, [session]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

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

  async function handleEmailSign(e) {
    console.log(checkPasswordStrength(password));
    e.preventDefault();
    try {
      if (signingUp) {
        if (password !== e.target["confirm-password"].value) {
          toast.error("Passwords do not match", {
            duration: 2000,
          });
        } else if (firstName == "" || lastName == "") {
          toast.error("Please enter your first and last name.");
        } else if (!checkPasswordStrength(password)) {
          toast.error(
            "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
          );
        } else {
          await signUp.email(
            {
              name: `${firstName} ${lastName}`,
              email,
              password,
              callbackURL: "/",
            },
            {
              onRequest: (ctx) => {
                toast.loading("Signing up...", {
                  id: "signing-up",
                });
              },
              onSuccess: (ctx) => {
                toast.success("Signed up", {
                  id: "signing-up",
                });
              },
              onError: (ctx) => {
                // display the error message
                toast.error(ctx.error.message, {
                  id: "signing-up",
                });
              },
            }
          );
        }
      } else {
        await signIn.email(
          { email, password, callbackURL: "/" },
          {
            onRequest: (ctx) => {
              toast.loading("Logging in...", {
                id: "signing-up",
              });
            },
            onSuccess: (ctx) => {
              //redirect to the dashboard or sign in page
            },
            onError: (ctx) => {
              // display the error message
              toast.error(
                ctx.error.message || "Please Connect to the Internet",
                {
                  id: "signing-up",
                }
              );
              console.log(ctx)
            },
          }
        );
      }
    } catch (e) {
      toast.error(e.message, {
        duration: 2000,
      });
      setErr(e.message);
    }
  }

  function handleSocial(provider) {
    toast.loading("Redirecting to " + provider, {
      id: "signing-up",
    });
    let scopes = [];
    if (provider === "spotify") {
      scopes = ["streaming", "user-read-email", "user-read-private", "playlist-read-private", "playlist-read-collaborative"];
    } else {
      scopes = [
        "https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/userinfo.email,openid",
      ];
    }
    signIn.social(
      { provider: provider },
      {
        onError: (ctx) => {
          // display the error message
          toast.error(ctx.error.message || "Please Connect to the Internet", {
            id: "signing-up",
            duration: 3000,
          });
        },
      }
    );
  }

  const resetPassword = () => {
    router.push("/reset-password");
  };

  useEffect(() => {
    document.title = "Peckodoro | Login";
  })


  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 text-ink">
      <div className="sticker w-full max-w-md bg-shell rounded-2xl p-6 md:p-8 space-y-6">
        <Link href="/" className="flex flex-col items-center gap-3">
          <Image
            src="/peckodoro.png"
            width={72}
            height={72}
            alt=""
            className="rounded-full border-2 border-ink"
            priority
          />
          <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl tracking-tight">
            {signingUp ? "Make an account" : "Welcome back"}
          </span>
        </Link>
        <form
          onSubmit={handleEmailSign}
          className="space-y-4"
          autoComplete="on"
        >
          <div className={signingUp ? "flex gap-3" : "hidden"}>
            <input
              className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors"
              placeholder="First name"
              aria-label="First name"
              type="name"
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors"
              placeholder="Last name"
              aria-label="Last name"
              type="name"
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <input
            className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors"
            placeholder="Email"
            aria-label="Email"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors"
            placeholder="Password"
            aria-label="Password"
            type="password"
            id="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className={`w-full px-3 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45 transition-colors ${signingUp ? "block" : "hidden"}`}
            placeholder="Confirm password"
            aria-label="Confirm password"
            type="password"
            id="confirm-password"
            minLength={8}
          />
          <button className="sticker-btn w-full py-3 bg-beak rounded-xl font-bold text-lg cursor-pointer">
            {signingUp ? "Sign up" : "Log in"}
          </button>
          <div>
            <div className="w-full flex justify-center pt-2 text-sm text-ink/70">
              {!signingUp
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                className="ml-1 cursor-pointer underline underline-offset-2 font-semibold text-ink"
                type="button"
                onClick={() => setSigningUp(!signingUp)}
              >
                {!signingUp ? "Sign up" : "Log in"}
              </button>
            </div>
            <div className="w-full flex justify-center pt-2 text-sm text-ink/70">
              {"Forgot your password?"}
              <button
                className="ml-1 cursor-pointer underline underline-offset-2 font-semibold text-ink"
                type="button"
                onClick={() => resetPassword()}
              >
                {"Reset it"}
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center text-sm text-ink/60">
          <hr className="flex-grow border-t border-ink/20" />
          <span className="mx-3">or</span>
          <hr className="flex-grow border-t border-ink/20" />
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => handleSocial("google")}
            className="sticker-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white cursor-pointer w-full justify-center font-semibold"
            type="button"
          >
            <span className="flex items-center">
              {/* Google logo SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 326667 333333"
                shapeRendering="geometricPrecision"
                textRendering="geometricPrecision"
                imageRendering="optimizeQuality"
                fillRule="evenodd"
                clipRule="evenodd"
                width={20}
                height={20}
              >
                <path
                  d="M326667 170370c0-13704-1112-23704-3518-34074H166667v61851h91851c-1851 15371-11851 38519-34074 54074l-311 2071 49476 38329 3428 342c31481-29074 49630-71852 49630-122593m0 0z"
                  fill="#4285f4"
                />
                <path
                  d="M166667 333333c44999 0 82776-14815 110370-40370l-52593-40742c-14074 9815-32963 16667-57777 16667-44074 0-81481-29073-94816-69258l-1954 166-51447 39815-673 1870c27407 54444 83704 91852 148890 91852z"
                  fill="#34a853"
                />
                <path
                  d="M71851 199630c-3518-10370-5555-21482-5555-32963 0-11482 2036-22593 5370-32963l-93-2209-52091-40455-1704 811C6482 114444 1 139814 1 166666s6482 52221 17777 74814l54074-41851m0 0z"
                  fill="#fbbc04"
                />
                <path
                  d="M166667 64444c31296 0 52406 13519 64444 24816l47037-45926C249260 16482 211666 1 166667 1 101481 1 45185 37408 17777 91852l53889 41853c13520-40185 50927-69260 95001-69260m0 0z"
                  fill="#ea4335"
                />
              </svg>
            </span>
            <span>
              Continue with Google
            </span>
          </button>

          
        </div>

        {err && <p className="text-[#b3261e] text-sm">{err}</p>}
      </div>
    </div>
  );
}
