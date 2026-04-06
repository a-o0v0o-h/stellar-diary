import InputModal from "@/components/InputModal";
import StarMap from "@/components/StarMap";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const diaries = await prisma.diary.findMany();
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <main className="min-h-screen min-w-screen bg-black p-4">
      <StarMap diaries={diaries} now={now} />
      <InputModal />
    </main>
  );
}
