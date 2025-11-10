import React from "react";
import WritingSection from "./components/WritingSection";

export const metadata = {
  title: `Oscar Watson-Smith`,
  description: `I've worked in the tech industry for over a decade wearing many hats. I've built products as an engineer, shifted between frontend and backend, to ultimately end up as people facing as I could get, implementing solutions for them.`,
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
          {`I've worked in the tech industry for over a decade wearing many hats. I've built products as an engineer, shifted between frontend and backend, to ultimately end up as people facing as I could get, implementing solutions for them.`}
        </p>
        <p className="text-lg text-zinc-600">
          {`Throughout it all I've had a genuine love of technology and what it can do. The novelty of being able to build anything, and share it with anyone, is yet to wear off on me.`}
        </p>
         <p className="text-lg text-zinc-600">
          {`I also angel invest in early stage startups operating in the design, frontend and observability space. If you're buiding in this area, I'd love to chat.`}
        </p>
      </div>

      {/* Logo cloud 
      <LogoCloud />*/}

      <WritingSection />
    </div>
  );
}

