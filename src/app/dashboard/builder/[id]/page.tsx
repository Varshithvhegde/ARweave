import BuilderPage from "@/components/builder/BuilderPage";

export default async function BuilderRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BuilderPage slug={id} />;
}
