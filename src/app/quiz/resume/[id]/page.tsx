import { ResumeClient } from "./ResumeClient";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResumeClient id={id} />;
}
