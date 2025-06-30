// "../../../public/setting.svg";
import Image from "next/image";

const header = (
  <div className="flex w-screen justify-between items-center py-4 md:px-8 px-4 border-b">
    <div className="font-semibold text-2xl cursor-pointer">Peckodoro <a className="text-sm text-gray-500" href="/versions/">0.1</a></div>
    <div className="flex gap-4">
      {/*<div className="border p-2 rounded-lg cursor-pointer flex items-center gap-2">
        <Image width={25} src="/settings.svg" height={25} alt = "settings-icon"></Image> Settings
      </div>*/}
      {/*<div className="border p-2 rounded-lg cursor-pointer">Sign in</div>*/}
    </div>
  </div>
);

export default header;
