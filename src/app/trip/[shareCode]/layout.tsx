import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ shareCode: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareCode } = await params;

  try {
    const trip = await prisma.trips.findUnique({
      where: { share_code: shareCode },
      select: {
        name: true,
        destination: true,
        start_date: true,
        end_date: true,
        members: { select: { id: true } },
      },
    });

    if (!trip) {
      return { title: "Trip Invite | Nassau" };
    }

    const memberCount = trip.members.length;
    const parts = [
      trip.destination,
      trip.start_date && trip.end_date ? `${trip.start_date} – ${trip.end_date}` : "",
      `${memberCount} golfer${memberCount !== 1 ? "s" : ""}`,
      "Join the trip",
    ].filter(Boolean);
    const description = parts.join(" · ");

    const subtitle = [
      trip.destination,
      trip.start_date && trip.end_date ? `${trip.start_date} – ${trip.end_date}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      title: `${trip.name || "Golf Trip"} — Nassau`,
      description,
      openGraph: {
        title: `${trip.name || "Golf Trip"} — Nassau`,
        description,
        images: [
          `/api/og/default?title=${encodeURIComponent(trip.name || "Golf Trip")}&subtitle=${encodeURIComponent(subtitle)}&type=trip`,
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${trip.name || "Golf Trip"} — Nassau`,
        description,
        images: [
          `/api/og/default?title=${encodeURIComponent(trip.name || "Golf Trip")}&subtitle=${encodeURIComponent(subtitle)}&type=trip`,
        ],
      },
    };
  } catch {
    return { title: "Trip Invite | Nassau" };
  }
}

export default function TripShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
