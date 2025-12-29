"use client";

import { Canvas } from "@react-three/fiber";
import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Record as RecordType } from "../lib/discogs";
import RecordMesh from "./Record";
import RecordInfo from "./RecordInfo";

interface RecordSceneProps {
  records: RecordType[];
}

export default function RecordScene({ records }: RecordSceneProps) {
  const [cameraY, setCameraY] = useState(-5);
  const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);
  const [hoveredRecord, setHoveredRecord] = useState<RecordType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Vertical spacing between records
  const recordSpacing = 0.12;
  const totalHeight = records.length * recordSpacing;
  const minY = -5;
  const maxY = totalHeight;

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.01;
      setCameraY((prev) => Math.max(minY, Math.min(maxY, prev + delta)));
    },
    [minY, maxY]
  );

  const handleRecordClick = useCallback(
    (record: RecordType) => {
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
      } else {
        setSelectedRecord(record);
      }
    },
    [selectedRecord]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      <Canvas
        camera={{
          position: [0, 1, 6],
          rotation: [Math.PI / 4, 0, 0],
          fov: 50,
          near: 0.1,
          far: 200,
        }}
        onPointerMissed={handleBackgroundClick}
      >
        <color attach="background" args={["#faf8f5"]} />

        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 10]} intensity={0.5} />

        {/* Records group - vertical column, pan with scroll */}
        <group position={[0, -cameraY, 0]}>
          {records.map((record, index) => (
            <RecordMesh
              key={record.id}
              record={record}
              index={index}
              isSelected={selectedRecord?.id === record.id}
              isHovered={hoveredRecord?.id === record.id}
              onClick={() => handleRecordClick(record)}
              onHover={(hovered) =>
                setHoveredRecord(hovered ? record : null)
              }
              spacing={recordSpacing}
            />
          ))}
        </group>
      </Canvas>

      {/* Info overlay */}
      <RecordInfo record={hoveredRecord || selectedRecord} />

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-zinc-500 hover:text-zinc-900 transition-colors text-sm"
      >
        ← Back
      </Link>

      {/* Scroll hint */}
      {!selectedRecord && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-400 text-sm animate-pulse">
          Scroll to browse
        </div>
      )}
    </div>
  );
}
