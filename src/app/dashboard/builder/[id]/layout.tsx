// Builder has its own full-screen layout, bypass dashboard layout
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
