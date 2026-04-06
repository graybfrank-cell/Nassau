# Nassau Instagram Carousels

Automated Instagram carousel generation using [Remotion](https://www.remotion.dev/). Define carousels as JSON, run one command, get branded PNG slides ready to post.

## Quick Start

```bash
cd marketing/carousels/nassau-carousels
npm install
```

### Render a carousel

```bash
npm run carousel -- ../../carousels/01-group-chat-death.json
```

Output PNGs land in `marketing/carousels/output/{carousel-id}/`.

### Preview in Remotion Studio

```bash
npm run studio
```

Opens a browser where you can preview slides with live reload.

## Creating a New Carousel

1. Create a JSON file in `marketing/carousels/carousels/`:

```json
{
  "id": "my-carousel",
  "caption": "Instagram caption text...",
  "slides": [
    { "template": "HookSlide", "props": { "headline": "Your hook here." } },
    { "template": "TextSlide", "props": { "theme": "light", "headline": "Main point.", "body": "Supporting text." } },
    { "template": "CTASlide", "props": {} }
  ]
}
```

2. Run: `npm run carousel -- ../../carousels/your-file.json`

## Templates

### HookSlide
Full-bleed opening slide with background image and headline.
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `headline` | string | yes | — |
| `backgroundImage` | string | no | gradient fallback |
| `overlay` | number | no | 0.55 |

### TextSlide
Versatile text slide for narrative content.
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `headline` | string | yes | — |
| `body` | string | no | — |
| `label` | string | no | — |
| `theme` | `"light"` \| `"dark"` | yes | — |

### QuoteSlide
Centered quote with decorative quote marks.
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `quote` | string | yes | — |
| `attribution` | string | no | — |
| `theme` | `"light"` \| `"dark"` | yes | — |

### ProductSlide
Product screenshot with caption and optional badge.
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `screenshot` | string | yes | — |
| `caption` | string | yes | — |
| `badge` | string | no | — |

### CTASlide
Call-to-action closing slide (dark theme).
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `headline` | string | no | `"All golf trips.\nOne link."` |
| `subtitle` | string | no | — |
| `cta` | string | no | `"Get on the waitlist → nassau.golf"` |

## Adding Background Images

Place images in `nassau-carousels/public/` and reference them in JSON as `"/assets/filename.png"` (they'll be resolved from the public directory).

## Output

All rendered slides are 1080×1350px PNGs (Instagram portrait format) saved to `marketing/carousels/output/{carousel-id}/`.
