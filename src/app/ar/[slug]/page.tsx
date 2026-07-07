import ARViewer from "@/components/ar/ARViewer";

export default async function ARPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ARViewer slug={slug} />;
}
