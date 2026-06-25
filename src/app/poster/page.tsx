import { PosterStudio } from "../PosterStudio";

export default async function PosterPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main style={{ minHeight: "100vh", background: "#0e1216", padding: 24 }}>
      <PosterStudio encoded={sp.p} />
    </main>
  );
}
