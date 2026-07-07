import ARViewer from "@/components/ar/ARViewer";

export default function ARPage({ params }: { params: { slug: string } }) {
  return <ARViewer slug={params.slug} />;
}
