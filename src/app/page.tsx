import React from "react";
import WritingSection from "./components/WritingSection";
import LogoCloud from "./components/LogoCloud";

export const metadata = {
  title: `Oscar Watson-Smith`,
  description: `I'm a Senior Sales Engineer at Figma. I've spent the past decade working at the nexus between Product and Go-to-market teams to build brilliant, delightful software! `,
  keywords: [
    "Oscar",
    "Watson-Smith",
    "Software Engineering",
    "Product",
    "Engineering",
    "Sales",
    "Seles Engineering",
  ],
};

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-xl gap-6 flex flex-col mt-8 sm:mt-24 px-4">
        <h1 className="text-4xl">{`👋 Hey, I'm Oscar`}</h1>
        <p className="text-lg text-zinc-600">
          {`
I'm a Senior Sales Engineer at `}
          <a href="https://figma.com"
            className="hover:text-blue-800 underline decoration-1 underline-offset-2"
          >
            Figma
          </a>
        </p>
        <p className="text-lg text-zinc-600">
          {`I've spent the past decade working at the nexus between Product and Go-to-market teams to build brilliant, delightful software!`}
        </p>
      </div>

      {/* Logo cloud */}
      <LogoCloud />

      <WritingSection />
    </div>
  );
}

