import type { MDXComponents } from "mdx/types";
import React, { ReactNode } from "react";

interface ParagraphProps {
  children: ReactNode;
}

const Paragraph: React.FC<ParagraphProps> = ({ children }) => (
  <p className="leading-6 py-2">{children}</p>
);

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    p: Paragraph,
  };
}
