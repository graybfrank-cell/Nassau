import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const trip = await prisma.trips.findUnique({
      where: { id },
      select: { name: true, destination: true, start_date: true, end_date: true },
    });

    if (!trip) {
      return { title: "Trip | Nassau" };
    }

    const subtitle = [trip.destination, trip.start_date && trip.end_date ? `${trip.start_date} – ${trip.end_date}` : ""]
      .filter(Boolean)
      .join(" · ");

    return {
      title: trip.name || "Trip",
      openGraph: {
        title: `${trip.name || "Golf Trip"} — Nassau`,
        description: subtitle || "View this trip on Nassau",
        images: [
          `/api/og/default?title=${encodeURIComponent(trip.name || "Golf Trip")}&subtitle=${encodeURIComponent(subtitle)}&type=trip`,
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${trip.name || "Golf Trip"} — Nassau`,
        images: [
          `/api/og/default?title=${encodeURIComponent(trip.name || "Golf Trip")}&subtitle=${encodeURIComponent(subtitle)}&type=trip`,
        ],
      },
    };
  } catch {
    return { title: "Trip | Nassau" };
  }
}

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
