import React from "react";
import WritingSection from "./components/WritingSection";

export const metadata = {
  title: `Oscar Watson-Smith`,
  description: `I've spent over a decade in tech—started as an engineer bouncing between frontend and backend, eventually finding my way to the customer-facing side as a sales engineer. Turns out I like the people part as much as the building part.`,
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
          {`I've spent over a decade in tech—started as an engineer bouncing between frontend and backend, eventually finding my way to the customer-facing side as a sales engineer. Turns out I like the people part as much as the building part.`}
        </p>
        <p className="text-lg text-zinc-600">
          {`Throughout it all I've had a genuine love of technology and what it can do. The novelty of being able to build anything, and share it with anyone, is yet to wear off on me.`}
        </p>
        <p className="text-lg text-zinc-600">
          {`I'm currently working on `}<a href="https://redbark.co">Redbark</a>{`, a platform for Aussie's to manage their finances and net worth with their own hands.`}
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

