"use client";

import { Record as RecordType } from "../lib/discogs";

interface RecordInfoProps {
  record: RecordType | null;
}

export default function RecordInfo({ record }: RecordInfoProps) {
  if (!record) return null;

  return (
    <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs transition-all flex gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={record.localCover || record.coverUrl}
        alt={record.title}
        className="w-20 h-20 rounded object-cover flex-shrink-0"
      />
      <div>
        <h2 className="font-serif text-lg text-zinc-900 leading-tight">
          {record.title}
        </h2>
        <p className="text-zinc-600 text-sm mt-1">{record.artist}</p>
        {record.year > 0 && (
          <p className="text-zinc-400 text-xs mt-1">{record.year}</p>
        )}
      </div>
    </div>
  );
}
