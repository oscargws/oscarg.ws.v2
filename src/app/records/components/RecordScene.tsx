"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useControls, Leva } from "leva";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Record as RecordType } from "../lib/discogs";
import RecordMesh, { GenreDivider } from "./Record";
import Player from "./Player";

// Backdrop that appears between stack and selected record
function Backdrop({ visible }: { visible: boolean }) {
  const { camera } = useThree();
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const [opacity, setOpacity] = useState(0);

  useFrame((_, delta) => {
    const targetOpacity = visible ? 0.5 : 0;
    setOpacity((prev) => THREE.MathUtils.lerp(prev, targetOpacity, delta * 4));

    if (materialRef.current) {
      materialRef.current.opacity = opacity;
    }
  });

  // Always render but control visibility via opacity
  if (opacity < 0.01 && !visible) return null;

  // Position backdrop in front of the stack (z~0) but behind the selected record (z~3)
  return (
    <mesh position={[camera.position.x, camera.position.y, 1.5]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial ref={materialRef} color="#000000" opacity={opacity} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

interface RecordSceneProps {
  records: RecordType[];
}

export default function RecordScene({ records }: RecordSceneProps) {
  const [cameraY, setCameraY] = useState(-6);
  const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);
  const [hoveredRecord, setHoveredRecord] = useState<RecordType | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort records by genre so they're grouped together
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const genreA = a.genre || "Unknown";
      const genreB = b.genre || "Unknown";
      return genreA.localeCompare(genreB);
    });
  }, [records]);

  // Debug controls
  const { camX, camY, camZ, camRotX, fov } = useControls("Camera", {
    camX: { value: 0, min: -10, max: 10, step: 0.1 },
    camY: { value: 1, min: -5, max: 10, step: 0.1 },
    camZ: { value: 4.9, min: 1, max: 20, step: 0.1 },
    camRotX: { value: 0.87, min: -Math.PI, max: Math.PI, step: 0.01 },
    fov: { value: 32, min: 20, max: 120, step: 1 },
  });

  const { spacing, leanAngle } = useControls("Records", {
    spacing: { value: 0.19, min: 0.05, max: 0.5, step: 0.01 },
    leanAngle: { value: 1.2, min: 0, max: Math.PI / 2, step: 0.01 },
  });

  // Data controls - informational
  useControls("Data", {
    recordCount: { value: records.length, disabled: true },
    hint: { value: "Set DISCOGS_LIVE=true to fetch live", disabled: true },
  });

  // Vertical spacing between records
  const recordSpacing = spacing;

  // Build interleaved list of records and dividers
  // Each item has a position in the stack
  const { items, totalItems } = useMemo(() => {
    const result: Array<{ type: 'record' | 'divider'; data: RecordType | string; position: number }> = [];
    let currentPosition = 0;
    let lastGenre = "";

    sortedRecords.forEach((record) => {
      const genre = record.genre || "Unknown";

      // Add divider before first record of new genre
      if (genre !== lastGenre) {
        result.push({ type: 'divider', data: genre, position: currentPosition });
        currentPosition++;
        lastGenre = genre;
      }

      // Add the record
      result.push({ type: 'record', data: record, position: currentPosition });
      currentPosition++;
    });

    return { items: result, totalItems: currentPosition };
  }, [sortedRecords]);

  const totalHeight = totalItems * recordSpacing;

  const { minY, maxY } = useControls("Scroll", {
    minY: { value: -6, min: -20, max: 0, step: 0.5 },
    maxY: { value: totalHeight, min: 0, max: totalHeight + 20, step: 0.5 },
  });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Disable scroll when a record is selected
      if (selectedRecord) return;

      e.preventDefault();
      const delta = e.deltaY * 0.01;
      setCameraY((prev) => Math.max(minY, Math.min(maxY, prev + delta)));

      // Track scroll distance and hide hint after 50px
      if (!hasScrolled) {
        scrollDistanceRef.current += Math.abs(e.deltaY);
        if (scrollDistanceRef.current >= 50) {
          setHasScrolled(true);
        }
      }
    },
    [minY, maxY, selectedRecord, hasScrolled]
  );

  const handleRecordClick = useCallback(
    (record: RecordType) => {
      if (selectedRecord?.id === record.id) {
        // Clicking selected record deselects it
        setSelectedRecord(null);
      } else if (!selectedRecord) {
        // Only allow selecting if nothing is selected
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
      <Leva hidden={process.env.NODE_ENV === "production"} />
      <Canvas
        onPointerMissed={handleBackgroundClick}
        dpr={[1, 1.5]} // Limit pixel ratio
        performance={{ min: 0.5 }} // Allow frame drops
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <PerspectiveCamera
          makeDefault
          position={[camX, camY, camZ]}
          rotation={[camRotX, 0, 0]}
          fov={fov}
          near={0.1}
          far={200}
        />
        <color attach="background" args={["#faf8f5"]} />

        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 10]} intensity={0.5} />
        {/* Front light for selected vinyl */}
        <pointLight position={[0, 2, 8]} intensity={1.5} distance={15} />

        {/* Records group - vertical column, pan with scroll */}
        <group position={[0, -cameraY, 0]}>
          {items.map((item) => {
            // Virtualization: only render items within view range
            const itemY = item.position * recordSpacing;
            const viewDistance = 9; // How many units above/below camera to render
            const isVisible = Math.abs(itemY - cameraY) < viewDistance;
            const isSelected = item.type === 'record' && selectedRecord?.id === (item.data as RecordType).id;

            // Always render selected record, skip others outside view
            if (!isVisible && !isSelected) return null;

            if (item.type === 'divider') {
              return (
                <GenreDivider
                  key={`divider-${item.data}`}
                  genre={item.data as string}
                  position={item.position}
                  spacing={recordSpacing}
                  leanAngle={leanAngle}
                />
              );
            } else {
              const record = item.data as RecordType;
              return (
                <RecordMesh
                  key={record.id}
                  record={record}
                  index={item.position}
                  isSelected={isSelected}
                  isHovered={hoveredRecord?.id === record.id && !selectedRecord}
                  onClick={() => handleRecordClick(record)}
                  onHover={(hovered) =>
                    setHoveredRecord(hovered ? record : null)
                  }
                  spacing={recordSpacing}
                  leanAngle={leanAngle}
                  scrollOffset={cameraY}
                />
              );
            }
          })}
        </group>

      </Canvas>

      {/* Player */}
      <Player record={selectedRecord} onClose={() => setSelectedRecord(null)} />

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-full transition-all text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Scroll hint */}
      {!selectedRecord && !hasScrolled && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-400 text-sm animate-pulse">
          Scroll to browse
        </div>
      )}

      {/* End of collection message */}
      {!selectedRecord && cameraY >= totalHeight - 2 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center transition-all duration-300">
          <p className="text-zinc-600 text-sm">
            Thanks for digging!
            <br/>
            Follow me on X at{" "}
            <a
              href="https://x.com/oscargws_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 hover:underline"
            >
              @oscargws_
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
