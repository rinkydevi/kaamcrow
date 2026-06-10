import Image from "next/image";

interface Props {
  className?: string;
  size?: number;
}

/**
 * Single transparent PNG crow. Dark mode: inverted to white via CSS filter.
 * No container — blends seamlessly with any background.
 */
export function CrowLogo({ className, size = 28 }: Props) {
  return (
    <>
      <Image
        src="/crow-logo-light-t.png"
        alt="KaamCrow"
        width={size}
        height={size}
        className={`block dark:hidden ${className ?? ""}`}
        priority
      />
      <Image
        src="/crow-logo-light-t.png"
        alt="KaamCrow"
        width={size}
        height={size}
        className={`hidden dark:block brightness-0 invert ${className ?? ""}`}
        priority
      />
    </>
  );
}

export function CrowBadge({ size = 48 }: { size?: number }) {
  return (
    <>
      <Image
        src="/crow-logo-light-t.png"
        alt="KaamCrow"
        width={size}
        height={size}
        className="block dark:hidden object-contain"
        priority
      />
      <Image
        src="/crow-logo-light-t.png"
        alt="KaamCrow"
        width={size}
        height={size}
        className="hidden dark:block object-contain brightness-0 invert"
        priority
      />
    </>
  );
}
