import InputModal from "@/components/InputModal";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const diaries = await prisma.diary.findMany();

  return (
    <main className="min-h-screen w-full max-w-3xl">
      <InputModal />
    </main>
  );
}
