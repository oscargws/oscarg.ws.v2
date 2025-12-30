"use client";

import { useRef, useState, useMemo, Suspense } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
  scrollOffset: number;
}

// Sleeve dimensions
const SLEEVE_SIZE = 2;
const SLEEVE_DEPTH = 0.015;

// Vinyl dimensions
const VINYL_RADIUS = 0.9;
const VINYL_THICKNESS = 0.008;

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

function VinylDisc({ spinning }: { spinning: boolean }) {
  const discRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);

  // 33 RPM = 33/60 rev/sec = 0.55 rev/sec = 0.55 * 2π rad/sec ≈ 3.46 rad/sec
  const RPM_33 = (33 / 60) * Math.PI * 2;

  useFrame((_, delta) => {
    if (spinning) {
      setRotation((prev) => prev - delta * RPM_33); // Negative for clockwise
    }
  });

  return (
    <group ref={discRef} rotation={[0, 0, rotation]}>
      {/* Main disc - faces camera */}
      <mesh>
        <circleGeometry args={[VINYL_RADIUS, 64]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Grooves - concentric rings */}
      <mesh position={[0, 0, 0.001]}>
        <ringGeometry args={[0.35, VINYL_RADIUS - 0.02, 64]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Label */}
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color="#d4c4a8" roughness={0.7} />
      </mesh>

      {/* Label markings to show rotation */}
      <mesh position={[0.15, 0, 0.003]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[-0.1, 0.12, 0.003]}>
        <circleGeometry args={[0.03, 16]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[0, -0.18, 0.003]}>
        <planeGeometry args={[0.15, 0.03]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Center hole */}
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[0.025, 16]} />
        <meshStandardMaterial color="#faf8f5" />
      </mesh>
    </group>
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
  scrollOffset,
}: RecordMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Animation state
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0, z: 0 });
  const [currentRot, setCurrentRot] = useState({ x: leanAngle, y: 0, z: 0 });
  const [vinylSlide, setVinylSlide] = useState(0);

  // Base position in stack
  const baseY = index * spacing;

  // Calculate position in front of camera along its view direction
  const distanceFromCamera = 4;
  const cameraRotX = camera.rotation.x;

  // Camera forward direction after X rotation: (0, sin(rotX), -cos(rotX))
  // Position in front of camera = camera.position + distance * forward
  // Add scrollOffset to compensate for parent group translation of -scrollOffset
  const selectedPos = {
    x: camera.position.x - 1.2, // Offset left for sleeve + vinyl layout
    y: camera.position.y + Math.sin(cameraRotX) * distanceFromCamera + scrollOffset,
    z: camera.position.z - Math.cos(cameraRotX) * distanceFromCamera,
  };

  // Target values
  const targetPos = isSelected
    ? selectedPos
    : { x: 0, y: baseY, z: isHovered ? 0.3 : 0 };

  // When selected, match camera's X rotation so record faces the camera
  const targetRot = isSelected
    ? { x: cameraRotX, y: 0, z: 0 } // Face camera by matching its tilt
    : { x: leanAngle, y: 0, z: 0 };

  const targetVinylSlide = isSelected ? 2.4 : 0; // Slide vinyl to the right

  useFrame((_, delta) => {
    const speed = 4;

    setCurrentPos((prev) => ({
      x: THREE.MathUtils.lerp(prev.x, targetPos.x, delta * speed),
      y: THREE.MathUtils.lerp(prev.y, targetPos.y, delta * speed),
      z: THREE.MathUtils.lerp(prev.z, targetPos.z, delta * speed),
    }));

    setCurrentRot((prev) => ({
      x: THREE.MathUtils.lerp(prev.x, targetRot.x, delta * speed),
      y: THREE.MathUtils.lerp(prev.y, targetRot.y, delta * speed),
      z: THREE.MathUtils.lerp(prev.z, targetRot.z, delta * speed),
    }));

    setVinylSlide((prev) => THREE.MathUtils.lerp(prev, targetVinylSlide, delta * speed));
  });

  return (
    <group
      ref={groupRef}
      position={[currentPos.x, currentPos.y, currentPos.z]}
      rotation={[currentRot.x, currentRot.y, currentRot.z]}
    >
      {/* Sleeve */}
      <Suspense fallback={<FallbackSleeve />}>
        <RecordSleeve record={record} onClick={onClick} onHover={onHover} />
      </Suspense>

      {/* Vinyl disc - only render when selected, slides to the right */}
      {isSelected && (
        <group
          position={[vinylSlide, 0, 0.01]}
          rotation={[0, 0, 0]}
        >
          <VinylDisc spinning={isSelected} />
        </group>
      )}
    </group>
  );
}
