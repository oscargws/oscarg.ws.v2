import { fetchDiscogsCollection } from "./lib/discogs";
import RecordScene from "./components/RecordScene";

export const metadata = {
  title: "Records | Oscar Watson-Smith",
  description: "My vinyl record collection",
};

export default async function RecordsPage() {
  const records = await fetchDiscogsCollection();

  return (
    <main className="fixed inset-0 bg-[#faf8f5]">
      <RecordScene records={records} />
    </main>
  );
}
