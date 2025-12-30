"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useControls } from "leva";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Record as RecordType } from "../lib/discogs";
import RecordMesh from "./Record";
import RecordInfo from "./RecordInfo";

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
  const [cameraY, setCameraY] = useState(-5);
  const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);
  const [hoveredRecord, setHoveredRecord] = useState<RecordType | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug controls
  const { camX, camY, camZ, camRotX, fov } = useControls("Camera", {
    camX: { value: 0, min: -10, max: 10, step: 0.1 },
    camY: { value: 1, min: -5, max: 10, step: 0.1 },
    camZ: { value: 6, min: 1, max: 20, step: 0.1 },
    camRotX: { value: Math.PI / 4, min: -Math.PI, max: Math.PI, step: 0.01 },
    fov: { value: 40, min: 20, max: 120, step: 1 },
  });

  const { spacing, leanAngle } = useControls("Records", {
    spacing: { value: 0.12, min: 0.05, max: 0.5, step: 0.01 },
    leanAngle: { value: 1.2, min: 0, max: Math.PI / 2, step: 0.01 },
  });

  // Data controls - informational
  useControls("Data", {
    recordCount: { value: records.length, disabled: true },
    hint: { value: "Set DISCOGS_LIVE=true to fetch live", disabled: true },
  });

  // Vertical spacing between records
  const recordSpacing = spacing;
  const totalHeight = records.length * recordSpacing;
  const minY = -5;
  const maxY = totalHeight;

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Disable scroll when a record is selected
      if (selectedRecord) return;

      e.preventDefault();
      const delta = e.deltaY * 0.01;
      setCameraY((prev) => Math.max(minY, Math.min(maxY, prev + delta)));
      setHasScrolled(true);
    },
    [minY, maxY, selectedRecord]
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
      <Canvas onPointerMissed={handleBackgroundClick}>
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

        {/* Records group - vertical column, pan with scroll */}
        <group position={[0, -cameraY, 0]}>
          {records.map((record, index) => (
            <RecordMesh
              key={record.id}
              record={record}
              index={index}
              isSelected={selectedRecord?.id === record.id}
              isHovered={hoveredRecord?.id === record.id && !selectedRecord}
              onClick={() => handleRecordClick(record)}
              onHover={(hovered) =>
                setHoveredRecord(hovered ? record : null)
              }
              spacing={recordSpacing}
              leanAngle={leanAngle}
              scrollOffset={cameraY}
            />
          ))}
        </group>

        {/* Dark backdrop between stack and selected record */}
        <Backdrop visible={!!selectedRecord} />
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
      {!selectedRecord && !hasScrolled && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-400 text-sm animate-pulse">
          Scroll to browse
        </div>
      )}
    </div>
  );
}
