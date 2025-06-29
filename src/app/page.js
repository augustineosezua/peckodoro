import Image from "next/image";
import header from "./Header/header";
import Timer from "./timer/timer";

export default function Home() {
  return (
    <div className="main">
      <div className="flex w-screen font-[family-name:var(--font-geist-sans)]">
        {header}
      </div>
      <div className="w-full">
        <Timer />
      </div>
      
    </div>
  );
}
