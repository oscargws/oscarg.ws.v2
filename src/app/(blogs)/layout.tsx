import React from "react";

const BlogLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col items-center mt-12 py-2 mb-12 px-4">
      <div className="max-w-3xl w-full">{children}</div>
    </div>
  );
};

export default BlogLayout;
