import Image from "next/image";
import manifest from "../../../../public/images/cv-guide/manifest.json";

interface Shot {
  desktop: string;
  mobile: string;
  width: number;
  height: number;
}

const SHOTS = (manifest as { shots: Record<string, Shot> }).shots;

/**
 * Renders a generated builder screenshot when one exists.
 *
 * The manifest ships empty and is filled by `npm run cv:screenshots`, so the guide never
 * shows a broken image on an environment where the screenshots have not been generated.
 */
export function GuideShot({ shot, alt }: { shot: string; alt: string }) {
  const entry = SHOTS[shot];
  if (!entry) return null;

  return (
    <figure className="mt-4 overflow-hidden rounded border border-[#E2E5EA]">
      <Image
        src={entry.desktop}
        alt={alt}
        width={entry.width}
        height={entry.height}
        className="h-auto w-full"
        sizes="(max-width: 1024px) 100vw, 1024px"
      />
    </figure>
  );
}
