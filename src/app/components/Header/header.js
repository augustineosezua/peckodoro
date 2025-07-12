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
    <div className="flex w-screen justify-between items-center py-4 md:px-8 px-4 border-b">
      <div className="font-semibold text-2xl cursor-default">
        Peckodoro{" "}
        <a
          className="text-sm text-gray-500 cursor-pointer"
          href="/versions/"
          target="blank"
        >
          0.1.1
        </a>
      </div>
      <div className="flex gap-4">
        <div
          className="border p-2 rounded-lg cursor-pointer flex items-center gap-2"
          onClick={() => {
            setShowSettings(true);
          }}
        >
          <Image
            width={25}
            src="/settings.svg"
            height={25}
            alt="settings-icon"
          ></Image>{" "}
          Settings
        </div>

        <div
          className="border p-2 rounded-lg cursor-pointer flex items-center gap-2"
          onClick={() => {
            handleClick();
          }}
        >
          {session ? "Sign Out" : "Log in"}
        </div>
        {/*<div className="border p-2 rounded-lg cursor-pointer">Sign in</div>*/}
      </div>
    </div>
  );
};

export default Header;
