import type { Metadata } from "next";
import { MyData } from "@/app/cv/my-data/_components/MyData";

export const metadata: Metadata = {
  title: "Your data",
  robots: { index: false, follow: false },
};

export default async function MyDataPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = typeof raw === "string" ? raw : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0D1B2A]">Your data</h1>
      <p className="mt-2 mb-8 text-[16px] leading-relaxed text-[#55616D]">
        Everything ArbeidMatch holds from the CV generator, with the controls to export it or
        delete it.
      </p>
      <MyData token={token} />
    </main>
  );
}
