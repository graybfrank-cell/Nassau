import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getDestinationBySlug,
  LAUNCH_DESTINATION_SLUGS,
  EXPLORE_DESTINATION_SLUGS,
  type Destination,
} from "@/lib/destination-utils";
import PreviewHero from "@/components/preview/PreviewHero";
import PreviewCourses from "@/components/preview/PreviewCourses";
import PreviewItinerary from "@/components/preview/PreviewItinerary";
import PreviewInsiderTips from "@/components/preview/PreviewInsiderTips";
import PreviewCTA from "@/components/preview/PreviewCTA";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [...LAUNCH_DESTINATION_SLUGS, ...EXPLORE_DESTINATION_SLUGS].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dest = getDestinationBySlug(slug);
  if (!dest) {
    return { title: "Destination Coming Soon" };
  }

  const title = `${dest.destination} Golf Trip`;
  const description = dest.why_go.slice(0, 155);

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Nassau`,
      description,
      url: `https://nassau.golf/trip/preview/${slug}`,
      siteName: "Nassau",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Nassau`,
      description,
    },
  };
}

export default async function TripPreviewPage({ params }: Props) {
  const { slug } = await params;
  const dest = getDestinationBySlug(slug);

  if (!dest) {
    return notFound();
  }

  const d: Destination = dest;
  const firstItinerary = Object.values(d.sample_itineraries ?? {}).find((it) => Array.isArray(it?.days) && it.days.length > 0) ?? null;

  return (
    <main>
      <PreviewHero dest={d} />

      <PreviewCourses courses={d.top_courses} />

      {firstItinerary && (
        <PreviewItinerary
          itinerary={firstItinerary}
          destinationName={d.destination}
        />
      )}

      <PreviewInsiderTips tips={d.insider_tips} />

      <PreviewCTA destinationName={d.destination} />
    </main>
  );
}
