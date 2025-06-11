"use client";

import React from 'react';
import Link from 'next/link';

const StickyNote: React.FC = () => {
  return (
    <Link href="/" className="block absolute -bottom-14 left-1/4 z-10">
      <div 
        className="relative w-28 h-28 cursor-pointer group"
        style={{
          transform: 'perspective(300px) rotateX(8deg) rotateY(-5deg)',
          transformStyle: 'preserve-3d',
          transformOrigin: 'top center',
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'perspective(300px) rotateX(20deg) rotateY(-8deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'perspective(300px) rotateX(8deg) rotateY(-5deg)';
        }}
      >
        {/* Sticky note with matching shadow */}
        <div 
          className="relative w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #fef08a 0%, #fde047 50%, #facc15 100%)',
            borderRadius: '2px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Content */}
          <div className="flex items-center justify-center h-full p-3 text-center">
            <div className="text-sm font-serif text-zinc-700 leading-tight">
              Take me
              <br />
              home!
            </div>
          </div>
          
          {/* Subtle texture lines */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full" style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 6px,
                rgba(0,0,0,0.1) 7px,
                rgba(0,0,0,0.1) 7px
              )`
            }}></div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StickyNote;