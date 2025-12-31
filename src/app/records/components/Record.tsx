"use client";

import { useRef, useState, useMemo, Suspense } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture, Text } from "@react-three/drei";
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
  isMobile?: boolean;
}

// Sleeve dimensions
const SLEEVE_SIZE = 2;
const SLEEVE_DEPTH = 0.015;

// Genre divider - full card with tab at top left
// Create a shape with only top corners rounded
function createTopRoundedRect(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  // Start at bottom-left (sharp corner)
  shape.moveTo(x, y);
  // Bottom edge to bottom-right (sharp corner)
  shape.lineTo(x + width, y);
  // Right edge up to top-right rounded corner
  shape.lineTo(x + width, y + height - radius);
  // Top-right rounded corner
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  // Top edge to top-left rounded corner
  shape.lineTo(x + radius, y + height);
  // Top-left rounded corner
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  // Left edge back to start
  shape.lineTo(x, y);

  return shape;
}

export function GenreDivider({
  genre,
  position,
  spacing,
  leanAngle,
  scrollOffset,
  isMobile = false,
}: {
  genre: string;
  position: number;
  spacing: number;
  leanAngle: number;
  scrollOffset: number;
  isMobile?: boolean;
}) {
  const baseY = position * spacing;
  const tabWidth = 0.5;
  const tabHeight = 0.12;
  const tabDepth = SLEEVE_DEPTH;

  const genreColor = getGenreColor(genre);
  const stickerRadius = 0.035;

  // Animation state - same as records for consistent scrolling
  // Start from behind (z: -2) so dividers animate in from back like records
  const [currentY, setCurrentY] = useState(baseY);
  const [currentZ, setCurrentZ] = useState(-2);
  const [currentScale, setCurrentScale] = useState(1);

  // Wave/dip effect - same as records
  let targetWaveEffect = 0;
  let targetScaleEffect = 1;
  const waveCenterOffset = 0.5;
  const distanceFromCenter = Math.abs(baseY - (scrollOffset + waveCenterOffset));
  const waveWidth = 0.8;

  if (isMobile) {
    const waveHeight = 0.4;
    targetWaveEffect = Math.max(0, waveHeight * Math.exp(-(distanceFromCenter * distanceFromCenter) / (2 * waveWidth * waveWidth)));
  } else {
    const dipDepth = 0.8;
    const scaleBoost = 0.15;
    const desktopWaveWidth = 1.5;
    const proximity = Math.exp(-(distanceFromCenter * distanceFromCenter) / (2 * desktopWaveWidth * desktopWaveWidth));
    targetWaveEffect = -dipDepth * proximity;
    targetScaleEffect = 1 + scaleBoost * proximity;
  }

  const targetY = baseY + targetWaveEffect;

  // Smooth animation - same speed as records
  useFrame((_, delta) => {
    const speed = 8;
    setCurrentY((prev) => THREE.MathUtils.lerp(prev, targetY, delta * speed));
    setCurrentZ((prev) => THREE.MathUtils.lerp(prev, 0, delta * speed));
    setCurrentScale((prev) => THREE.MathUtils.lerp(prev, targetScaleEffect, delta * speed));
  });

  // Create tab geometry with only top corners rounded
  const tabGeometry = useMemo(() => {
    const shape = createTopRoundedRect(tabWidth, tabHeight, 0.03);
    const extrudeSettings = {
      depth: tabDepth,
      bevelEnabled: false,
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center the geometry on Z axis
    geometry.translate(0, 0, -tabDepth / 2);
    return geometry;
  }, [tabWidth, tabHeight, tabDepth]);

  return (
    <group
      position={[0, currentY, currentZ]}
      rotation={[leanAngle, 0, 0]}
      scale={currentScale}
    >
      {/* Main card - same size as record sleeve */}
      <mesh>
        <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_DEPTH]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.95} />
      </mesh>

      {/* Tab at top left */}
      <mesh
        geometry={tabGeometry}
        position={[-SLEEVE_SIZE / 2 + tabWidth / 2 + 0.1, SLEEVE_SIZE / 2 + tabHeight / 2, 0]}
      >
        <meshStandardMaterial color="#f5f0e6" roughness={0.95} />
      </mesh>

      {/* Genre color sticker on tab */}
      <mesh position={[-SLEEVE_SIZE / 2 + stickerRadius + 0.15, SLEEVE_SIZE / 2 + tabHeight / 2, SLEEVE_DEPTH / 2 + 0.001]}>
        <circleGeometry args={[stickerRadius, 16]} />
        <meshStandardMaterial color={genreColor} roughness={0.6} />
      </mesh>

      {/* Genre text on tab */}
      <Text
        position={[-SLEEVE_SIZE / 2 + tabWidth / 2 + 0.18, SLEEVE_SIZE / 2 + tabHeight / 2, SLEEVE_DEPTH / 2 + 0.001]}
        fontSize={0.05}
        color="#333333"
        anchorX="center"
        anchorY="middle"
      >
        {genre.toLowerCase()}
      </Text>
    </group>
  );
}

// Vinyl dimensions
const VINYL_RADIUS = 0.9;

// Sleeve with album art texture
function TexturedSleeve({
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
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: "#f5f5f5",
      roughness: 0.9,
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      color: "#e8e8e8",
      roughness: 0.9,
    });

    // Box faces: +X, -X, +Y, -Y, +Z (front/cover), -Z (back)
    return [
      edgeMaterial,   // +X
      edgeMaterial,   // -X
      edgeMaterial,   // +Y (top edge)
      edgeMaterial,   // -Y (bottom edge)
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

// Genre to sticker color mapping
const GENRE_COLORS: { [key: string]: string } = {
  "Electronic": "#00ff88",
  "House": "#00ff88",
  "Techno": "#ff00ff",
  "Ambient": "#00ccff",
  "Drum n Bass": "#ffff00",
  "Jungle": "#ffff00",
  "Hip Hop": "#ff6600",
  "Rap": "#ff6600",
  "Rock": "#ff0000",
  "Pop": "#ff69b4",
  "Jazz": "#9966ff",
  "Soul": "#ffcc00",
  "Funk": "#ffcc00",
  "Disco": "#ff1493",
  "Reggae": "#00ff00",
  "Dub": "#00ff00",
  "Classical": "#ffffff",
  "Experimental": "#888888",
  "Industrial": "#444444",
  "Unknown": "#666666",
};

function getGenreColor(genre: string | undefined): string {
  if (!genre) return GENRE_COLORS["Unknown"];

  // Check for exact match first
  if (GENRE_COLORS[genre]) return GENRE_COLORS[genre];

  // Check for partial match
  const lowerGenre = genre.toLowerCase();
  for (const [key, color] of Object.entries(GENRE_COLORS)) {
    if (lowerGenre.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerGenre)) {
      return color;
    }
  }

  return GENRE_COLORS["Unknown"];
}

// Seeded random for consistent sticker placement per record
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Plain sleeve using blank texture for records that only have label images
function PlainSleeve({
  genre,
  recordId,
  artist,
  title,
  onClick,
  onHover,
}: {
  genre?: string;
  recordId: number;
  artist: string;
  title: string;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}) {
  // Alternate between blank textures based on record ID
  const useBlackTexture = recordId % 2 === 0;
  const texturePath = useBlackTexture ? "/records/blank-black.jpg" : "/records/blank.jpeg";
  const texture = useTexture(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Rotate texture at 90° intervals based on record ID for variation
  const rotationIndex = recordId % 4;
  const clonedTexture = useMemo(() => {
    const t = texture.clone();
    t.center.set(0.5, 0.5);
    t.rotation = (rotationIndex * Math.PI) / 2; // 0, 90, 180, or 270 degrees
    t.needsUpdate = true;
    return t;
  }, [texture, rotationIndex]);

  const stickerColor = getGenreColor(genre);

  // Vary sticker position slightly based on record ID
  const offsetX = (seededRandom(recordId) - 0.5) * 0.15;
  const offsetY = (seededRandom(recordId + 1) - 0.5) * 0.15;

  // Vary label sticker position and rotation
  const labelOffsetX = (seededRandom(recordId + 2) - 0.5) * 0.1;
  const labelOffsetY = (seededRandom(recordId + 3) - 0.5) * 0.1;
  const labelRotation = (seededRandom(recordId + 4) - 0.5) * (Math.PI / 90); // -1 to +1 degrees

  // Rounded rectangle shape for label
  const labelShape = useMemo(() => {
    const width = 0.35;
    const height = 0.2;
    const radius = 0.02;
    const shape = new THREE.Shape();

    shape.moveTo(-width / 2 + radius, -height / 2);
    shape.lineTo(width / 2 - radius, -height / 2);
    shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
    shape.lineTo(width / 2, height / 2 - radius);
    shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
    shape.lineTo(-width / 2 + radius, height / 2);
    shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
    shape.lineTo(-width / 2, -height / 2 + radius);
    shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);

    return shape;
  }, []);

  // Worn white label material
  const labelMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSeed: { value: recordId },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uSeed;
        varying vec2 vUv;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        void main() {
          // Muted off-white base - less bright for matte look
          vec3 baseColor = vec3(0.88, 0.86, 0.82);

          // Paper grain noise
          float noise = random(vUv * 100.0 + uSeed) * 0.06;
          float noise2 = random(vUv * 30.0 + uSeed * 2.0) * 0.04;

          // Age spots / yellowing
          float spots = random(vUv * 10.0 + uSeed * 3.0);
          float yellowing = spots > 0.8 ? 0.02 : 0.0;

          vec3 finalColor = baseColor - noise - noise2;
          finalColor.r += yellowing;
          finalColor.g += yellowing * 0.8;

          // Worn edges
          float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
          float edgeWear = smoothstep(0.0, 0.05, edgeDist);
          finalColor *= 0.92 + edgeWear * 0.08;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, [recordId]);

  // Create noisy/paper texture effect with custom shader material for sticker
  const stickerMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(stickerColor) },
        uSeed: { value: recordId },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uSeed;
        varying vec2 vUv;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        void main() {
          vec3 desaturated = mix(uColor, vec3(dot(uColor, vec3(0.299, 0.587, 0.114))), 0.3);
          vec3 baseColor = desaturated * 0.55;
          float noise = random(vUv * 80.0 + uSeed) * 0.2;
          float noise2 = random(vUv * 20.0 + uSeed * 2.0) * 0.1;
          vec3 finalColor = baseColor * (0.8 + noise + noise2);
          float dist = length(vUv - 0.5) * 2.0;
          finalColor *= 1.0 - dist * 0.2;
          finalColor += vec3(0.02, 0.015, 0.0);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, [stickerColor, recordId]);

  const sleeveMaterials = useMemo(() => {
    const coverMaterial = new THREE.MeshStandardMaterial({
      map: clonedTexture,
      roughness: 0.8,
    });
    // Use dark edges for black texture, light edges for white texture
    const edgeColor = useBlackTexture ? "#1a1a1a" : "#f5f5f5";
    const backColor = useBlackTexture ? "#222222" : "#e8e8e8";
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: edgeColor,
      roughness: 0.9,
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      color: backColor,
      roughness: 0.9,
    });

    return [
      edgeMaterial,   // +X
      edgeMaterial,   // -X
      edgeMaterial,   // +Y
      edgeMaterial,   // -Y
      coverMaterial,  // +Z (front)
      backMaterial,   // -Z (back)
    ];
  }, [clonedTexture, useBlackTexture]);

  return (
    <group>
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

      {/* Genre sticker - top left corner with varied placement */}
      <mesh position={[-SLEEVE_SIZE / 2 + 0.2 + offsetX, SLEEVE_SIZE / 2 - 0.2 + offsetY, SLEEVE_DEPTH / 2 + 0.001]}>
        <circleGeometry args={[0.075, 32]} />
        <primitive object={stickerMaterial} attach="material" />
      </mesh>

      {/* White label sticker - top right with handwritten info */}
      <group position={[
        SLEEVE_SIZE / 2 - 0.25 + labelOffsetX,
        SLEEVE_SIZE / 2 - 0.28 + labelOffsetY,
        SLEEVE_DEPTH / 2 + 0.001
      ]}>
        {/* Sticker background - rounded rectangle */}
        <mesh rotation={[0, 0, labelRotation]}>
          <shapeGeometry args={[labelShape]} />
          <primitive object={labelMaterial} attach="material" />
        </mesh>

        {/* Artist name */}
        <Text
          position={[-0.16, 0.04, 0.001]}
          fontSize={0.026}
          color="#222222"
          anchorX="left"
          anchorY="middle"
          rotation={[0, 0, labelRotation]}
          maxWidth={0.32}
        >
          {artist.length > 18 ? artist.slice(0, 18) + "..." : artist}
        </Text>

        {/* Album title */}
        <Text
          position={[-0.16, -0.025, 0.001]}
          fontSize={0.02}
          color="#444444"
          anchorX="left"
          anchorY="middle"
          rotation={[0, 0, labelRotation]}
          maxWidth={0.32}
        >
          {title.length > 22 ? title.slice(0, 22) + "..." : title}
        </Text>
      </group>
    </group>
  );
}

// Wrapper to choose between textured and plain sleeve
function RecordSleeve({
  record,
  onClick,
  onHover,
}: {
  record: RecordType;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}) {
  if (record.isLabelImage) {
    return (
      <PlainSleeve
        genre={record.genre}
        recordId={record.id}
        artist={record.artist}
        title={record.title}
        onClick={onClick}
        onHover={onHover}
      />
    );
  }
  return <TexturedSleeve record={record} onClick={onClick} onHover={onHover} />;
}

function FallbackSleeve() {
  return (
    <mesh>
      <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_DEPTH]} />
      <meshStandardMaterial color="#333" roughness={0.9} />
    </mesh>
  );
}

// Generic vinyl label (beige with markings)
function GenericLabel() {
  return (
    <>
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
    </>
  );
}

// Custom label with texture from Discogs image
function TexturedLabel({ labelUrl }: { labelUrl: string }) {
  const texture = useTexture(labelUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh position={[0, 0, 0.002]}>
      <circleGeometry args={[0.3, 64]} />
      <meshStandardMaterial map={texture} roughness={0.7} />
    </mesh>
  );
}

function VinylDisc({ spinning, labelUrl }: { spinning: boolean; labelUrl?: string }) {
  const discRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);

  // 33 RPM = 33/60 rev/sec = 0.55 rev/sec = 0.55 * 2π rad/sec ≈ 3.46 rad/sec
  const RPM_33 = (33 / 60) * Math.PI * 2;

  useFrame((_, delta) => {
    if (spinning) {
      setRotation((prev) => prev - delta * RPM_33); // Negative for clockwise
    }
  });

  // Generate groove rings
  const grooveRings = useMemo(() => {
    const rings = [];
    const innerRadius = 0.35; // Start after label
    const outerRadius = VINYL_RADIUS - 0.02;
    const numGrooves = 40; // Number of visible groove rings
    const step = (outerRadius - innerRadius) / numGrooves;

    for (let i = 0; i < numGrooves; i++) {
      const r1 = innerRadius + i * step;
      const r2 = r1 + step * 0.6; // Groove width
      rings.push({ inner: r1, outer: r2, key: i });
    }
    return rings;
  }, []);

  return (
    <group ref={discRef} rotation={[0, 0, rotation]}>
      {/* Main disc base - glossy black vinyl */}
      <mesh>
        <circleGeometry args={[VINYL_RADIUS, 64]} />
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.15}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grooves - multiple concentric rings for realistic look */}
      {grooveRings.map((ring) => (
        <mesh key={ring.key} position={[0, 0, 0.0005]}>
          <ringGeometry args={[ring.inner, ring.outer, 64]} />
          <meshStandardMaterial
            color="#151515"
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
      ))}

      {/* Outer edge highlight */}
      <mesh position={[0, 0, 0.001]}>
        <ringGeometry args={[VINYL_RADIUS - 0.015, VINYL_RADIUS, 64]} />
        <meshStandardMaterial color="#222222" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Inner groove area highlight - the "sheen" ring */}
      <mesh position={[0, 0, 0.0008]}>
        <ringGeometry args={[0.34, 0.36, 64]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.05} metalness={0.95} />
      </mesh>

      {/* Label - either textured from Discogs or generic */}
      {labelUrl ? (
        <Suspense fallback={<GenericLabel />}>
          <TexturedLabel labelUrl={labelUrl} />
        </Suspense>
      ) : (
        <GenericLabel />
      )}

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
  isMobile = false,
}: RecordMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Animation state - start from behind (negative Z) so records animate in from back
  const baseY = index * spacing;
  // Slight random x offset for natural stack look
  const xOffset = useMemo(() => (seededRandom(record.id) - 0.5) * 0.03, [record.id]);
  const [currentPos, setCurrentPos] = useState({ x: xOffset, y: baseY, z: -2 });
  const [currentRot, setCurrentRot] = useState({ x: leanAngle, y: 0, z: 0 });
  const [currentScale, setCurrentScale] = useState(1);
  const [vinylSlide, setVinylSlide] = useState(0);

  // Staged animation:
  // Opening: 1 = moving to center, 2 = sliding left, 3 = vinyl out
  // Closing: 4 = vinyl back in, 5 = return to stack
  // 0 = idle in stack
  const [animationStage, setAnimationStage] = useState(0);
  const [wasSelected, setWasSelected] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Calculate position in front of camera along its view direction
  const distanceFromCamera = 5;
  const cameraRotX = camera.rotation.x;

  // Camera forward direction after X rotation: (0, sin(rotX), -cos(rotX))
  // Position in front of camera = camera.position + distance * forward
  // Add scrollOffset to compensate for parent group translation of -scrollOffset
  const centerPos = {
    x: camera.position.x,
    y: camera.position.y + Math.sin(cameraRotX) * distanceFromCamera + scrollOffset,
    z: camera.position.z - Math.cos(cameraRotX) * distanceFromCamera,
  };

  const selectedPos = {
    x: camera.position.x - 0.9, // Offset left for sleeve + vinyl layout
    y: centerPos.y,
    z: centerPos.z,
  };

  // Handle selection state changes
  useFrame(() => {
    if (isSelected && !wasSelected) {
      // Just became selected - start opening animation sequence with lift
      setAnimationStage(1); // Start with lift stage
      setWasSelected(true);
      setIsClosing(false);
    } else if (!isSelected && wasSelected && !isClosing) {
      // Just became deselected - start closing animation sequence
      if (isMobile) {
        // On mobile, go to lift position first (no vinyl animation)
        setAnimationStage(6);
      } else {
        // On desktop, start with vinyl going back in
        setAnimationStage(5);
      }
      setIsClosing(true);
    }
  });

  // Determine target position based on animation stage
  const hoverDistance = 1.3;
  let targetPos: { x: number; y: number; z: number };
  let targetRot: { x: number; y: number; z: number };
  let targetScale: number;
  let targetVinylSlide: number;

  // Wave/dip effect based on distance from camera view center
  // Calculate directly so it updates every frame as scrollOffset changes
  let waveEffect = 0;
  let scaleEffect = 1;
  const waveCenterOffset = 0.5; // Offset from scroll position to center of visible area
  const distanceFromCenter = Math.abs(baseY - (scrollOffset + waveCenterOffset));
  const waveWidth = 0.8; // How wide the effect spreads (in spacing units)

  if (isMobile) {
    const waveHeight = 0.4; // Max lift height
    // Gaussian-like falloff for smooth wave - lifts UP on mobile
    waveEffect = Math.max(0, waveHeight * Math.exp(-(distanceFromCenter * distanceFromCenter) / (2 * waveWidth * waveWidth)));
  } else {
    // Desktop: dip DOWN and scale UP for records near camera
    const dipDepth = 0.8; // How much to dip down
    const scaleBoost = 0.15; // How much to scale up (15%)
    const desktopWaveWidth = 1.5; // Wider spread for desktop
    const proximity = Math.exp(-(distanceFromCenter * distanceFromCenter) / (2 * desktopWaveWidth * desktopWaveWidth));
    waveEffect = -dipDepth * proximity; // Negative = dip down
    scaleEffect = 1 + scaleBoost * proximity;
  }

  if (animationStage === 0) {
    // Idle in stack - stack position with wave effect (lifts records UP), or hover (desktop only)
    const showHover = isHovered && !isMobile;
    targetPos = {
      x: xOffset,
      y: baseY + waveEffect + (showHover ? hoverDistance * 0.3 : 0),
      z: showHover ? hoverDistance : 0,
    };
    targetRot = { x: leanAngle, y: 0, z: 0 };
    targetScale = scaleEffect;
    targetVinylSlide = 0;
  } else if (animationStage === 1) {
    // Stage 1: Lift along lean angle - moves perpendicular to record face to avoid clipping
    const liftDistance = 2.0; // Distance to lift along lean direction
    // Lift perpendicular to the leaning record (up and back along lean angle)
    const liftY = liftDistance * Math.cos(leanAngle);
    const liftZ = liftDistance * Math.sin(leanAngle);
    targetPos = {
      x: xOffset,
      y: baseY + liftY,
      z: liftZ,
    };
    targetRot = { x: leanAngle, y: 0, z: 0 };
    targetScale = 1;
    targetVinylSlide = 0;
  } else if (animationStage === 2) {
    // Stage 2: Move to center (on mobile, this is the final selected state)
    targetPos = isMobile ? centerPos : centerPos;
    targetRot = { x: cameraRotX, y: 0, z: 0 };
    targetScale = 1;
    targetVinylSlide = 0;
  } else if (animationStage === 3) {
    // Stage 3: Slide left (desktop only)
    targetPos = selectedPos;
    targetRot = { x: cameraRotX, y: 0, z: 0 };
    targetScale = 1;
    targetVinylSlide = 0;
  } else if (animationStage === 4) {
    // Stage 4: Vinyl slides out (desktop only)
    targetPos = selectedPos;
    targetRot = { x: cameraRotX, y: 0, z: 0 };
    targetScale = 1;
    targetVinylSlide = 2.0;
  } else if (animationStage === 5) {
    // Stage 5: Vinyl slides back in (desktop only)
    targetPos = selectedPos;
    targetRot = { x: cameraRotX, y: 0, z: 0 };
    targetScale = 1;
    targetVinylSlide = 0;
  } else if (animationStage === 6) {
    // Stage 6: Lift position before returning to stack (reverse of stage 1)
    const liftDistance = 2.0;
    const liftY = liftDistance * Math.cos(leanAngle);
    const liftZ = liftDistance * Math.sin(leanAngle);
    targetPos = {
      x: xOffset,
      y: baseY + liftY,
      z: liftZ,
    };
    targetRot = { x: leanAngle, y: 0, z: 0 };
    targetScale = 1;
    targetVinylSlide = 0;
  } else {
    // Stage 7: Return to stack
    targetPos = {
      x: xOffset,
      y: baseY,
      z: 0,
    };
    targetRot = { x: leanAngle, y: 0, z: 0 };
    targetScale = scaleEffect;
    targetVinylSlide = 0;
  }

  useFrame((_, delta) => {
    const speed = 5;
    const threshold = 0.05;

    // Animate position
    const newPos = {
      x: THREE.MathUtils.lerp(currentPos.x, targetPos.x, delta * speed),
      y: THREE.MathUtils.lerp(currentPos.y, targetPos.y, delta * speed),
      z: THREE.MathUtils.lerp(currentPos.z, targetPos.z, delta * speed),
    };
    setCurrentPos(newPos);

    // Animate rotation
    setCurrentRot((prev) => ({
      x: THREE.MathUtils.lerp(prev.x, targetRot.x, delta * speed),
      y: THREE.MathUtils.lerp(prev.y, targetRot.y, delta * speed),
      z: THREE.MathUtils.lerp(prev.z, targetRot.z, delta * speed),
    }));

    // Animate vinyl
    setVinylSlide((prev) => THREE.MathUtils.lerp(prev, targetVinylSlide, delta * speed));

    // Animate scale
    setCurrentScale((prev) => THREE.MathUtils.lerp(prev, targetScale, delta * speed));

    // Check if current stage animation is complete, then advance
    const posDistance = Math.abs(newPos.x - targetPos.x) +
                        Math.abs(newPos.y - targetPos.y) +
                        Math.abs(newPos.z - targetPos.z);
    const vinylDistance = Math.abs(vinylSlide - targetVinylSlide);

    // Opening animation stages
    if (animationStage === 1 && posDistance < threshold) {
      // Lift complete, move to center
      setAnimationStage(2);
    } else if (animationStage === 2 && posDistance < threshold) {
      // On mobile, stay at stage 2 (centered). On desktop, continue to stage 3
      if (!isMobile) {
        setAnimationStage(3);
      }
    } else if (animationStage === 3 && posDistance < threshold) {
      setAnimationStage(4);
    }
    // Closing animation stages
    else if (animationStage === 5 && vinylDistance < threshold) {
      // Vinyl back in, now go to lift position
      setAnimationStage(6);
    } else if (animationStage === 6 && posDistance < threshold) {
      // At lift position, now return to stack
      setAnimationStage(7);
    } else if (animationStage === 7 && posDistance < threshold) {
      setAnimationStage(0);
      setWasSelected(false);
      setIsClosing(false);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[currentPos.x, currentPos.y, currentPos.z]}
      rotation={[currentRot.x, currentRot.y, currentRot.z]}
      scale={currentScale}
    >
      {/* Sleeve */}
      <Suspense fallback={<FallbackSleeve />}>
        <RecordSleeve record={record} onClick={onClick} onHover={onHover} />
      </Suspense>

      {/* Vinyl disc - render during vinyl out (stage 4) and closing animation (stage 5) - desktop only */}
      {!isMobile && (animationStage === 4 || animationStage === 5) && (
        <group
          position={[vinylSlide, 0, -0.02]}
          rotation={[0, 0, 0]}
        >
          <VinylDisc
            spinning={isSelected}
            labelUrl={record.isLabelImage ? record.localCover : undefined}
          />
        </group>
      )}
    </group>
  );
}
