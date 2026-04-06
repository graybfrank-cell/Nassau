import React from "react";
import { HookSlide } from "./templates/HookSlide";
import { TextSlide } from "./templates/TextSlide";
import { QuoteSlide } from "./templates/QuoteSlide";
import { ProductSlide } from "./templates/ProductSlide";
import { CTASlide } from "./templates/CTASlide";

const templates: Record<string, React.FC<any>> = {
  HookSlide,
  TextSlide,
  QuoteSlide,
  ProductSlide,
  CTASlide,
};

type SlideCompositionProps = {
  templateName: string;
  templateProps: Record<string, unknown>;
  playfairFamily: string;
  interFamily: string;
};

export const SlideComposition: React.FC<SlideCompositionProps> = ({
  templateName,
  templateProps,
  playfairFamily,
  interFamily,
}) => {
  const Template = templates[templateName];
  if (!Template) {
    throw new Error(`Unknown template: ${templateName}`);
  }
  return (
    <Template
      {...templateProps}
      playfairFamily={playfairFamily}
      interFamily={interFamily}
    />
  );
};
