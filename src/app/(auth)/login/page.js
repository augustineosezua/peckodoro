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
                toast.loading("Siging up...", {
                  id: "signing-up",
                });
              },
              onSuccess: (ctx) => {
                toast.success("Signed up successfully", {
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
              toast.loading("Signing In...", {
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
      scopes = ["streaming", "user-read-email", "user-read-private"];
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
    <div className=" h-screen flex flex-col justify-center items-center font-[family-name:var(--font-figtree)]">
      <div className="w-3/4 max-w-lg mx-auto lg:p-10 space-y-6 my-0">
        <span className="font-semibold text-4xl w-full flex items-center justify-center cursor-pointer" onClick={()=>router.push("/")}>
          Peckodoro
        </span>
        <form
          onSubmit={handleEmailSign}
          className="space-y-4"
          autoComplete="on"
        >
          <div className={signingUp ? "flex gap-4" : "hidden"}>
            <input
              className="border w-full p-2 rounded"
              placeholder="First Name"
              type="name"
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="border w-full p-2 rounded"
              placeholder="Last Name"
              type="name"
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <input
            className="border w-full p-2 rounded"
            placeholder="Email"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="border w-full p-2 rounded"
            placeholder="Password"
            type="password"
            id="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className={`border w-full p-2 rounded ${signingUp ? "block" : "hidden"}`}
            placeholder="Confrim Password"
            type="password"
            id="confirm-password"
            minLength={8}
          />
          <button className="w-full p-2 bg-black text-white rounded cursor-pointer">
            {signingUp ? "Register with Email" : "Sign in with Email"}
          </button>
          <div>
            <div className="w-full flex justify-center pt-2">
              {!signingUp
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                className="ml-1 cursor-pointer underline"
                type="button"
                onClick={() => setSigningUp(!signingUp)}
              >
                {!signingUp ? "Sign up now" : "Sign in now"}
              </button>
            </div>
            <div className="w-full flex justify-center pt-2">
              {"Forgot your password?"}
              <button
                className="ml-1 cursor-pointer underline"
                type="button"
                onClick={() => resetPassword()}
              >
                {"Reset it now"}
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center font-[family-name:var(--font-figtree)]">
          <hr className="flex-grow border-t-2 border-black" />
          <span className="mx-4 text-lg">or continue with</span>
          <hr className="flex-grow border-t-2 border-black" />
        </div>

        <div className="flex justify-center gap-4 ">
          <button
            onClick={() => handleSocial("google")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 shadow-sm bg-white hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer w-36 justify-center"
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
                width={35}
                height={35}
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
            <span className="font-medium text-gray-800 text-base hidden lg:block">
              {" "}
              Google
            </span>
          </button>

          <button
            onClick={() => handleSocial("spotify")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 shadow-sm bg-white hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer w-36 justify-center"
            type="button"
          >
            <span className="flex items-center">
              {/* Spotify logo SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 236.05 225.25"
                width={35}
                height={35}
              >
                <path
                  fill="#1ed760"
                  d="M122.37,3.31C61.99.91,11.1,47.91,8.71,108.29c-2.4,60.38,44.61,111.26,104.98,113.66,60.38,2.4,111.26-44.6,113.66-104.98C229.74,56.59,182.74,5.7,122.37,3.31Zm46.18,160.28c-1.36,2.4-4.01,3.6-6.59,3.24-.79-.11-1.58-.37-2.32-.79-14.46-8.23-30.22-13.59-46.84-15.93-16.62-2.34-33.25-1.53-49.42,2.4-3.51.85-7.04-1.3-7.89-4.81-.85-3.51,1.3-7.04,4.81-7.89,17.78-4.32,36.06-5.21,54.32-2.64,18.26,2.57,35.58,8.46,51.49,17.51,3.13,1.79,4.23,5.77,2.45,8.91Zm14.38-28.72c-2.23,4.12-7.39,5.66-11.51,3.43-16.92-9.15-35.24-15.16-54.45-17.86-19.21-2.7-38.47-1.97-57.26,2.16-1.02.22-2.03.26-3.01.12-3.41-.48-6.33-3.02-7.11-6.59-1.01-4.58,1.89-9.11,6.47-10.12,20.77-4.57,42.06-5.38,63.28-2.4,21.21,2.98,41.46,9.62,60.16,19.74,4.13,2.23,5.66,7.38,3.43,11.51Zm15.94-32.38c-2.1,4.04-6.47,6.13-10.73,5.53-1.15-.16-2.28-.52-3.37-1.08-19.7-10.25-40.92-17.02-63.07-20.13-22.15-3.11-44.42-2.45-66.18,1.97-5.66,1.15-11.17-2.51-12.32-8.16-1.15-5.66,2.51-11.17,8.16-12.32,24.1-4.89,48.74-5.62,73.25-2.18,24.51,3.44,47.99,10.94,69.81,22.29,5.12,2.66,7.11,8.97,4.45,14.09Z"
                />
              </svg>
            </span>
            <span className="font-medium text-gray-800 text-base hidden lg:block">
              {" "}
              Spotify
            </span>
          </button>
        </div>

        {err && <p className="text-red-500">{err}</p>}
      </div>
    </div>
  );
}
