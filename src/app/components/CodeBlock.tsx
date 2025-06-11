"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface CodeBlockProps {
  children: ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children }) => {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) {
      const codeElements = preRef.current.querySelectorAll('code');
      codeElements.forEach((codeElement) => {
        hljs.highlightElement(codeElement as HTMLElement);
      });
    }
  }, [children]);

  return (
    <pre ref={preRef} className="rounded-lg overflow-x-auto my-4 text-xs leading-5">
      {children}
    </pre>
  );
};

export default CodeBlock;