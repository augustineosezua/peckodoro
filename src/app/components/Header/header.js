// "../../../public/setting.svg";
import Image from "next/image";
import { signIn, signOut, useSession } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const Header = ({ showSettings, setShowSettings, session }) => {
  const router = useRouter();
  const handleClick = () => {
    if (session) {
      toast.loading("Signing Out...", {
        id: "signing-out",
      });
      signOut();
    } else {
      toast.loading("Redirecting...", {
        id: "redirecting",
      });
      router.push("/login");
    }
  };
  return (
    <header className="flex w-full justify-between items-center py-4 md:px-8 px-4 border-b-2 border-ink">
      <div className="flex items-center gap-3 cursor-default">
        <Image
          src="/peckodoro.png"
          width={44}
          height={44}
          alt=""
          className="rounded-full border-2 border-ink"
          priority
        />
        <span className="font-[family-name:var(--font-display)] font-extrabold text-2xl tracking-tight">
          Peckodoro
        </span>
        <a
          className="hidden sm:inline text-xs font-semibold text-ink/60 hover:text-ink underline-offset-2 hover:underline"
          href="/versions/"
          target="_blank"
          title="See what's new"
        >
          v2-B
        </a>
      </div>
      <nav className="flex gap-2 md:gap-3">
        <button
          type="button"
          className="sticker-btn bg-shell px-3 py-2 rounded-xl cursor-pointer flex items-center gap-2 font-semibold"
          onClick={() => {
            setShowSettings(true);
          }}
          aria-label="Settings"
          data-tour="settings"
        >
          <Image width={20} src="/settings.svg" height={20} alt="" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        <button
          type="button"
          className={`sticker-btn px-4 py-2 rounded-xl cursor-pointer font-semibold ${
            session ? "bg-shell" : "bg-yolk"
          }`}
          onClick={() => {
            handleClick();
          }}
        >
          {session ? "Sign out" : "Log in"}
        </button>
      </nav>
    </header>
  );
};

export default Header;
