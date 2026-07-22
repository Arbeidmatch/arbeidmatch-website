import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";

const goldBtn =
  "inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-xl bg-[#C9A84C] px-8 py-3.5 text-center text-[16px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] sm:w-auto";

export default function CandidateAccountSection() {
  return (
    <section className="border-b border-[rgba(201,168,76,0.14)] bg-[#0a121c] py-12 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-10 md:space-y-12">
          <div
            id="register"
            className="scroll-mt-[100px] rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] p-6 md:p-8"
          >
            <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-[28px]">
              New here? Join our candidate network
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">
              Create your profile on our jobs portal to get matched with roles across Norway.
            </p>
            <div className="mt-6">
              <a
                href={CANDIDATE_PORTAL_SIGNUP_URL}
                className={goldBtn}
                rel="noopener noreferrer"
              >
                Register as candidate
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(201,168,76,0.35)] bg-[#0D1B2A] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] md:p-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-[28px]">Already registered?</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">
              Access your profile and track your applications.
            </p>
            <div className="mt-6">
              <a href={CANDIDATE_PORTAL_LOGIN_URL} className={goldBtn} rel="noopener noreferrer">
                Sign in to your profile
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
