import React from "react";
import WritingSection from "./components/WritingSection";
import LogoCloud from "./components/LogoCloud";

export const metadata = {
  title: `Oscar Watson-Smith`,
  description: `Hey I'm Oscar. I've spent the better half of a decade working at the nexus between
          product, engineering and sales to build and sell brilliant software at
          companies such as Datadog & Vanta`,
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
I'm an Enterprise Solutions Consultant at Figma, where I focus on design systems and work with organizations to transform their engineering and design workflows.`}
        </p>
        <p className="text-lg text-zinc-600">
          {`
I've spent nearly a decade working in Product teams from both an Engineering and GTM perspective. I working with product and sales teams to build brilliant software.`}
        </p>
      </div>
      
      {/* Logo cloud */}
      <LogoCloud />
      
      <WritingSection />
    </div>
  );
}

