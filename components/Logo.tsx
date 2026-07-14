import Image from "next/image";

const ASPECT_RATIO = 488 / 600;

export default function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-liceo.png"
      alt="Liceo Eduardo Charme"
      width={Math.round(size * ASPECT_RATIO)}
      height={size}
      className={className}
      preload
    />
  );
}
