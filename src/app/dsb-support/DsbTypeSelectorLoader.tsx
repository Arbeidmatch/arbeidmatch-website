"use client";

import dynamic from "next/dynamic";

const DsbTypeSelector = dynamic(() => import("@/components/dsb/DsbTypeSelector"), { ssr: false, loading: () => null });

type Props = {
  /** When true, the full-screen selector is not auto-opened (e.g. long-form /dsb-support guide). */
  disableAutoOpen?: boolean;
};

export default function DsbTypeSelectorLoader({ disableAutoOpen }: Props) {
  return <DsbTypeSelector disableAutoOpen={disableAutoOpen} />;
}
