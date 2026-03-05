const TEMPLATES: Record<string, string[]> = {
  competitive: [
    "The {city} Showdown",
    "The {city} Classic",
    "{city} Championship",
    "The {city} Open",
  ],
  party: [
    "{city} & Fairways",
    "The {city} Sendoff",
    "{city} Tee Party",
    "Boys Trip: {city}",
  ],
  relaxed: [
    "{city} Links Getaway",
    "The {city} Retreat",
    "Easy {city}",
    "{city} Chill & Chip",
  ],
  "father-son": [
    "The {city} Pilgrimage",
    "{city} Father-Son Classic",
    "{city} Legacy Trip",
    "Pops & Putts: {city}",
  ],
  corporate: [
    "{city} Team Classic",
    "The {city} Invitational",
    "{city} Corporate Cup",
    "{city} Team Outing",
  ],
  "bucket-list": [
    "{city} Dream Trip",
    "The {city} Experience",
    "Once in a Lifetime: {city}",
    "{city} Bucket List",
  ],
};

const FALLBACK = ["{city} Golf Trip", "The {city} Trip"];

export function generateTripName(
  vibe: string | null,
  destination: string
): string {
  // Extract city name (before comma or the whole string)
  const city = destination.split(",")[0].trim() || "Golf";

  const templates = TEMPLATES[vibe || ""] || FALLBACK;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace("{city}", city);
}
