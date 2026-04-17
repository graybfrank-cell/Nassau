# Destination Hero Images

Drop AI-generated or photographed destination images here and they'll appear on the
Explore page automatically as long as they follow the naming convention below.

## Naming convention

Files must be named `{destination-slug}.{ext}` where:

- `destination-slug` matches the `id` field in
  `src/data/nassau-knowledge-base.json` — for example `scottsdale-az`,
  `bandon-dunes-or`, `pinehurst-nc`, `st-andrews-scotland`.
- `ext` is one of `jpg`, `jpeg`, `png`, or `webp`.

Examples:

```
scottsdale-az.jpg
bandon-dunes-or.webp
pinehurst-nc.png
st-andrews-scotland.jpg
```

## Resolution order

`src/lib/destination-images.ts` → `getDestinationImage(slug)` walks this chain:

1. Local file registered in `DESTINATION_IMAGE_MANIFEST` (this directory)
2. Unsplash fallback URL registered in `UNSPLASH_PHOTO_MAP`
3. A region-themed CSS gradient from `getRegionGradient(region, vibe)`

So you can add a local image without touching Unsplash config, and the
card image upgrades silently the moment the file is committed.

## Why a manifest instead of filesystem scan?

The Explore page is a client component (`"use client"`) and cannot read
`public/` at runtime. Keeping a small manifest:

- Lets Next.js statically know which paths to optimize
- Avoids 404 flashes for destinations without local art
- Keeps control of which files are "canonical" if a directory gets messy

To wire up a new image, add one line to `DESTINATION_IMAGE_MANIFEST` in
`src/lib/destination-images.ts` pointing at the filename you dropped here.

## Existing legacy filenames

Some hand-authored files predate this convention
(e.g. `Kapalua, HITrip Card.png`). They're still referenced via the
manifest with URL-encoded paths so they keep rendering, but any *new*
image you add should follow the `{slug}.{ext}` convention above.

## Recommended sizes

- Minimum: 1200 × 900 (4:3) for card layout
- Preferred: 1600 × 1200 for retina
- Keep file size under ~1.5 MB (current legacy PNGs are ~9 MB each and should
  eventually be re-exported as optimized JPEGs or WebP)
