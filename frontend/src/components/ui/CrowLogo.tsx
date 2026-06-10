import Image from "next/image";

interface Props {
  className?: string;
  size?: number;
}

/** No container — blends seamlessly with any background. */
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
        src="/crow-logo.png"
        alt="KaamCrow"
        width={size}
        height={size}
        className={`hidden dark:block ${className ?? ""}`}
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
        src="/crow-logo.png"
        alt="KaamCrow"
        width={size}
        height={size}
        className="hidden dark:block object-contain"
        priority
      />
    </>
  );
}
