"use client";

import { useEffect, useState } from "react";
import { Record } from "../lib/discogs";

interface PlayerProps {
  record: Record | null;
  onClose?: () => void;
}

export default function Player({ record, onClose }: PlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Record | null>(null);

  useEffect(() => {
    if (record) {
      setCurrentRecord(record);
      // Small delay to trigger animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      // Keep record data until animation completes
      const timeout = setTimeout(() => setCurrentRecord(null), 400);
      return () => clearTimeout(timeout);
    }
  }, [record]);

  if (!currentRecord) return null;

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 z-50
        bg-black rounded-2xl overflow-hidden
        shadow-2xl border border-zinc-800
        transition-all duration-300 ease-out
        ${isVisible
          ? "opacity-100 -translate-x-1/2 translate-y-0"
          : "opacity-0 -translate-x-1/2 translate-y-4"
        }
      `}
      style={{ minWidth: "320px", maxWidth: "420px" }}
    >
      <div className="p-3 px-5 flex items-center gap-4">
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm truncate">
            {currentRecord.artist}
          </p>
          <p className="text-neutral-400 text-sm truncate">
            {currentRecord.title} {currentRecord.year > 0 && `(${currentRecord.year})`}
          </p>
        </div>

        {/* Discogs link */}
        {currentRecord.discogsUrl && (
          <a
            href={currentRecord.discogsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors p-2"
            title="View on Discogs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white transition-colors p-2 cursor-pointer"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
