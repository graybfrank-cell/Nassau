import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";

interface SlideDefinition {
  template: string;
  props: Record<string, unknown>;
}

interface CarouselDefinition {
  id: string;
  caption?: string;
  slides: SlideDefinition[];
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: npm run carousel -- <path-to-carousel.json>");
    process.exit(1);
  }

  const resolvedPath = path.resolve(jsonPath);
  const carousel: CarouselDefinition = JSON.parse(
    fs.readFileSync(resolvedPath, "utf-8")
  );

  const outputDir = path.resolve(
    __dirname,
    "..",
    "..",
    "output",
    carousel.id
  );
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Bundling Remotion project...`);
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "index.ts"),
    webpackOverride: (config) => config,
  });

  console.log(`Rendering ${carousel.slides.length} slides for "${carousel.id}"...\n`);

  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i];
    const slideNum = String(i + 1).padStart(2, "0");
    const outputPath = path.join(outputDir, `slide-${slideNum}.png`);

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "slide",
      inputProps: {
        templateName: slide.template,
        templateProps: slide.props,
      },
    });

    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outputPath,
      inputProps: {
        templateName: slide.template,
        templateProps: slide.props,
      },
    });

    console.log(`  ✓ slide-${slideNum}.png (${slide.template})`);
  }

  console.log(`\nDone! ${carousel.slides.length} slides saved to ${outputDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
