"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { useControls, Leva } from "leva";
import { PerspectiveCamera } from "@react-three/drei";
import { Record as RecordType } from "../lib/discogs";
import RecordMesh, { GenreDivider } from "./Record";
import Player from "./Player";

interface RecordSceneProps {
  records: RecordType[];
}

// Inertia controller component that runs inside Canvas
function InertiaController({
  velocityRef,
  isDeceleratingRef,
  setCameraY,
  minY,
  maxY,
}: {
  velocityRef: React.MutableRefObject<number>;
  isDeceleratingRef: React.MutableRefObject<boolean>;
  setCameraY: React.Dispatch<React.SetStateAction<number>>;
  minY: number;
  maxY: number;
}) {
  useFrame(() => {
    if (!isDeceleratingRef.current) return;

    const velocity = velocityRef.current;
    
    // Stop if velocity is too low
    if (Math.abs(velocity) < 0.0001) {
      isDeceleratingRef.current = false;
      velocityRef.current = 0;
      return;
    }

    // Apply friction decay
    velocityRef.current *= 0.95;

    // Update camera position
    setCameraY((prev) => {
      const next = prev + velocityRef.current;
      // Stop inertia if hitting bounds
      if (next <= minY || next >= maxY) {
        isDeceleratingRef.current = false;
        velocityRef.current = 0;
        return Math.max(minY, Math.min(maxY, next));
      }
      return next;
    });
  });

  return null;
}

export default function RecordScene({ records }: RecordSceneProps) {
  const [cameraY, setCameraY] = useState(-6);
  const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);
  const [hoveredRecord, setHoveredRecord] = useState<RecordType | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const lastTouchYRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const isDeceleratingRef = useRef<boolean>(false);

  // Detect mobile/small screens
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sort records by genre so they're grouped together
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const genreA = a.genre || "Unknown";
      const genreB = b.genre || "Unknown";
      return genreA.localeCompare(genreB);
    });
  }, [records]);

  // Debug controls (desktop values)
  const { camX: desktopCamX, camY: desktopCamY, camZ: desktopCamZ, camRotX: desktopCamRotX, camRotY: desktopCamRotY, fov: desktopFov } = useControls("Camera", {
    camX: { value: 0, min: -10, max: 10, step: 0.1 },
    camY: { value: 1, min: -5, max: 10, step: 0.1 },
    camZ: { value: 4.9, min: 1, max: 20, step: 0.1 },
    camRotX: { value: 0.87, min: -Math.PI, max: Math.PI, step: 0.01 },
    camRotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    fov: { value: 32, min: 20, max: 120, step: 1 },
  });

  const { spacing: desktopSpacing, leanAngle: desktopLeanAngle } = useControls("Records", {
    spacing: { value: 0.19, min: 0.05, max: 0.5, step: 0.01 },
    leanAngle: { value: 1.2, min: 0, max: Math.PI / 2, step: 0.01 },
  });

  // Mobile-specific camera and record values
  const camX = isMobile ? 0 : desktopCamX;
  const camY = isMobile ? 2.5 : desktopCamY;
  const camZ = isMobile ? 5.3 : desktopCamZ;
  const camRotX = isMobile ? 0.73 : desktopCamRotX;
  const camRotY = isMobile ? 0 : desktopCamRotY;
  const fov = isMobile ? 45 : desktopFov;
  const spacing = isMobile ? 0.19 : desktopSpacing;
  const leanAngle = isMobile ? 1.2 : desktopLeanAngle;

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
      const delta = e.deltaY * -0.01;
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

  // Touch handlers for mobile drag scrolling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (selectedRecord) return;
    // Stop any ongoing inertia
    isDeceleratingRef.current = false;
    velocityRef.current = 0;
    
    touchStartRef.current = e.touches[0].clientY;
    lastTouchYRef.current = e.touches[0].clientY;
    lastTouchTimeRef.current = performance.now();
  }, [selectedRecord]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (selectedRecord || touchStartRef.current === null) return;

    const currentY = e.touches[0].clientY;
    const currentTime = performance.now();
    const deltaY = currentY - lastTouchYRef.current;
    const deltaTime = currentTime - lastTouchTimeRef.current;
    
    lastTouchYRef.current = currentY;
    lastTouchTimeRef.current = currentTime;

    // Calculate velocity (pixels per ms, converted to scroll units)
    if (deltaTime > 0) {
      velocityRef.current = (deltaY / deltaTime) * 0.3;
    }

    // Reduced sensitivity for more natural feel
    setCameraY((prev) => Math.max(minY, Math.min(maxY, prev + deltaY * 0.012)));

    // Track scroll distance for hiding hint
    if (!hasScrolled) {
      scrollDistanceRef.current += Math.abs(deltaY);
      if (scrollDistanceRef.current >= 50) {
        setHasScrolled(true);
      }
    }
  }, [minY, maxY, selectedRecord, hasScrolled]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    // Start inertia if there's meaningful velocity
    if (Math.abs(velocityRef.current) > 0.001) {
      isDeceleratingRef.current = true;
    }
  }, []);

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
          rotation={[camRotX, camRotY, 0]}
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
                  isMobile={isMobile}
                />
              );
            }
          })}
        </group>

        {/* Inertia controller for smooth mobile scrolling */}
        <InertiaController
          velocityRef={velocityRef}
          isDeceleratingRef={isDeceleratingRef}
          setCameraY={setCameraY}
          minY={minY}
          maxY={maxY}
        />
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
          {isMobile ? "Swipe to browse" : "Scroll to browse"}
        </div>
      )}

      {/* End of collection message */}
      <div
        className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          text-center transition-all duration-500 ease-out
          ${!selectedRecord && cameraY >= totalHeight - 2
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
          }
        `}
      >
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

      {/* Built by credit - desktop only */}
      {!isMobile && (
        <a
          href="https://x.com/oscargws_"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 text-neutral-400 text-xs hover:text-neutral-600 transition-colors"
        >
          built by @oscargws
        </a>
      )}
    </div>
  );
}
