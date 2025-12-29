"use client";

import { useRef, useState, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Record as RecordType } from "../lib/discogs";

interface RecordMeshProps {
  record: RecordType;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  spacing: number;
  leanAngle: number;
}

// Sleeve dimensions
const SLEEVE_SIZE = 2;
const SLEEVE_DEPTH = 0.015;

function RecordSleeve({
  record,
  onClick,
  onHover,
}: {
  record: RecordType;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}) {
  const texture = useTexture(record.localCover);
  texture.colorSpace = THREE.SRGBColorSpace;

  const sleeveMaterials = useMemo(() => {
    const coverMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
    });
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: "#1a1a1a",
      roughness: 0.9,
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      color: "#222222",
      roughness: 0.9,
    });

    // Box faces: +X, -X, +Y, -Y, +Z (front/cover), -Z (back)
    return [
      sideMaterial,   // +X
      sideMaterial,   // -X
      sideMaterial,   // +Y (top edge)
      sideMaterial,   // -Y (bottom edge)
      coverMaterial,  // +Z (cover facing camera)
      backMaterial,   // -Z (back)
    ];
  }, [texture]);

  return (
    <mesh
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        onHover(false);
        document.body.style.cursor = "auto";
      }}
      material={sleeveMaterials}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_DEPTH]} />
    </mesh>
  );
}

function FallbackSleeve() {
  return (
    <mesh>
      <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_DEPTH]} />
      <meshStandardMaterial color="#333" roughness={0.9} />
    </mesh>
  );
}

export default function RecordMesh({
  record,
  index,
  isSelected,
  isHovered,
  onClick,
  onHover,
  spacing,
  leanAngle,
}: RecordMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Animation state
  const [currentZ, setCurrentZ] = useState(0);

  // Target values - pull forward when selected
  const targetZ = isSelected ? 1.5 : isHovered ? 0.3 : 0;

  useFrame((_, delta) => {
    const speed = 6;
    setCurrentZ((prev) => THREE.MathUtils.lerp(prev, targetZ, delta * speed));
  });

  // Position: stacked vertically (Y axis)
  const yPosition = index * spacing;

  return (
    <group
      ref={groupRef}
      position={[0, yPosition, currentZ]}
      rotation={[leanAngle, 0, 0]}
    >
      {/* Sleeve */}
      <Suspense fallback={<FallbackSleeve />}>
        <RecordSleeve record={record} onClick={onClick} onHover={onHover} />
      </Suspense>

    </group>
  );
}
