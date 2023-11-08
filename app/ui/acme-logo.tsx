import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { lusitana } from "@/app/ui/fonts";
import Image from "next/image";

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <p className="text-[32px] ">Wyzard.ai</p>
      <Image
        src="/wyzard.png"
        alt="Wyzard Logo"
        width={120}
        height={120}
        className="-ml-4"
      />
    </div>
  );
}
