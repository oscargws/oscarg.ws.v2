import React from "react";
import StickyNote from "../components/StickyNote";

const BlogLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col items-center mt-12 py-2 mb-24 px-4">
      <div className="max-w-2xl w-full relative">
        {/* Paper container */}
        <div className="bg-white shadow-xl border border-zinc-200 rounded-lg p-12 pb-32 relative">
          {children}
        </div>
        
        {/* Sticky note hanging over bottom right */}
        <StickyNote />
      </div>
    </div>
  );
};

export default BlogLayout;
