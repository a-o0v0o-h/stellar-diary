import InputModal from "@/components/InputModal";
import StarMap from "@/components/StarMap";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

export default async function Home() {
  const now = dayjs().unix();
  const thirtyDaysAgo = dayjs().subtract(30, "day").toDate();
  const diaries = await prisma.diary.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  return (
    <main className="h-screen w-screen overflow-hidden bg-black p-4">
      <StarMap diaries={diaries} now={now} />
      <InputModal />
    </main>
  );
}
