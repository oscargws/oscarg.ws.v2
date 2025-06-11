import React from "react";
import StickyNote from "../components/StickyNote";

const BlogLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col items-center mt-4  sm:mt-12 py-2 mb-28 px-2 sm:px-4">
      <div className="max-w-2xl w-full relative">
        {/* Paper container */}
        <div className="bg-white shadow-xl border border-zinc-200 rounded-lg px-4 py-2 md:px-12 md:py-12 pb-32 relative">
          {children}
        </div>
        
        {/* Sticky note hanging over bottom right */}
        <StickyNote />
      </div>
    </div>
  );
};

export default BlogLayout;
