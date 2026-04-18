"use client";

import dynamic from "next/dynamic";

const DsbTypeSelector = dynamic(() => import("@/components/dsb/DsbTypeSelector"), { ssr: false, loading: () => null });

export default function DsbTypeSelectorLoader() {
  return <DsbTypeSelector />;
}
