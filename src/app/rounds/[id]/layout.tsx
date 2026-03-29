import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const round = await prisma.rounds.findUnique({
      where: { id },
      select: { course_name: true, date: true, name: true },
    });

    if (!round) {
      return { title: "Round | Nassau" };
    }

    const title = round.course_name || round.name || "Round";
    const subtitle = round.date || "";

    return {
      title,
      openGraph: {
        title: `${title} — Nassau`,
        description: subtitle || "View this round on Nassau",
        images: [
          `/api/og/default?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&type=round`,
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} — Nassau`,
        images: [
          `/api/og/default?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&type=round`,
        ],
      },
    };
  } catch {
    return { title: "Round | Nassau" };
  }
}

export default function RoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
