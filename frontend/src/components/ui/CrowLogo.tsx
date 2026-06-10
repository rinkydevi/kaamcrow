import Image from "next/image";

interface Props {
  className?: string;
  size?: number;
}

/**
 * Single crow image. Dark mode inverts it to white via CSS filter.
 * No conditional rendering — avoids dark:hidden/dark:block issues.
 */
export function CrowLogo({ className, size = 28 }: Props) {
  return (
    <Image
      src="/crow-logo-light-t.png"
      alt="KaamCrow"
      width={size}
      height={size}
      className={`dark:invert ${className ?? ""}`}
      priority
    />
  );
}

export function CrowBadge({ size = 48 }: { size?: number }) {
  return (
    <Image
      src="/crow-logo-light-t.png"
      alt="KaamCrow"
      width={size}
      height={size}
      className="object-contain dark:invert"
      priority
    />
  );
}
