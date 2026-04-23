import EmployerTrialClient from "./EmployerTrialClient";

export default async function EmployerTrialPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <EmployerTrialClient token={token} />;
}

