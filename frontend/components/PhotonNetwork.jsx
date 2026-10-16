"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

/* ─── Node & path data for the liquidity network ─── */
const NETWORK_NODES = [
  { id: "uni",   label: "Uniswap",   pos: [-3.2,  1.8,  0.5], size: 0.18, junction: true  },
  { id: "sushi", label: "SushiSwap", pos: [ 2.8,  2.2, -0.3], size: 0.14, junction: false },
  { id: "curve", label: "Curve",     pos: [-1.5, -1.6,  0.8], size: 0.16, junction: true  },
  { id: "bal",   label: "Balancer",  pos: [ 3.5, -0.8,  0.2], size: 0.13, junction: false },
  { id: "1inch", label: "1inch",     pos: [ 0.2,  3.0, -0.5], size: 0.15, junction: false },
  { id: "pan",   label: "Pancake",   pos: [-3.0, -0.2, -0.4], size: 0.12, junction: false },
  { id: "dodo",  label: "DODO",      pos: [ 1.0, -2.5,  0.3], size: 0.12, junction: false },
  { id: "phot",  label: "Photon",    pos: [ 0.0,  0.3,  0.0], size: 0.22, junction: true  },
];

const CONNECTIONS = [
  [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
  [0, 2], [0, 4], [1, 3], [2, 6], [4, 1], [5, 2], [3, 6],
];

const BLUE  = "#53B8FF";
const CYAN  = "#63F0E0";

/* ─── Three.js scene components (lazy-loaded) ─── */

function NetworkNode({ position, size, isJunction, color }) {
  const meshRef = useRef();
  const glowRef = useRef();

  return (
    <group position={position}>
      {/* glow halo */}
      <mesh ref={glowRef} scale={isJunction ? 2.8 : 2.2}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} />
      </mesh>

      {/* core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isJunction ? 0.9 : 0.5}
          roughness={0.3}
          metalness={0.4}
          transparent
          opacity={0.92}
        />
      </mesh>
    </group>
  );
}

function ConnectionPath({ start, end, index }) {
  const lineRef = useRef();
  const pulseRef = useRef();

  /* Compute midpoint with a small curve offset */
  const mid = useMemo(() => {
    const mx = (start[0] + end[0]) / 2;
    const my = (start[1] + end[1]) / 2;
    const mz = (start[2] + end[2]) / 2 + 0.3;
    return [mx, my, mz];
  }, [start, end]);

  /* Quadratic bezier points for the path */
  const points = useMemo(() => {
    const pts = [];
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const u = 1 - t;
      const x = u * u * start[0] + 2 * u * t * mid[0] + t * t * end[0];
      const y = u * u * start[1] + 2 * u * t * mid[1] + t * t * end[1];
      const z = u * u * start[2] + 2 * u * t * mid[2] + t * t * end[2];
      pts.push([x, y, z]);
    }
    return pts;
  }, [start, end, mid]);

  /* Animated light pulse traveling along the path */
  const PulseDot = () => {
    const dotRef = useRef();
    const { useFrame } = require("@react-three/fiber");

    const speed = 0.3 + (index % 5) * 0.08;
    const offset = (index * 0.17) % 1;

    useFrame(({ clock }) => {
      if (!dotRef.current) return;
      const t = ((clock.getElapsedTime() * speed + offset) % 1);
      const idx = Math.floor(t * (points.length - 1));
      const nextIdx = Math.min(idx + 1, points.length - 1);
      const frac = t * (points.length - 1) - idx;

      const p = points[idx];
      const pn = points[nextIdx];
      dotRef.current.position.set(
        p[0] + (pn[0] - p[0]) * frac,
        p[1] + (pn[1] - p[1]) * frac,
        p[2] + (pn[2] - p[2]) * frac
      );
    });

    return (
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.9} />
      </mesh>
    );
  };

  const flatPoints = useMemo(
    () => new Float32Array(points.flat()),
    [points]
  );

  return (
    <group>
      {/* connection line */}
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={flatPoints}
            count={points.length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={BLUE} transparent opacity={0.15} />
      </line>
      <PulseDot />
    </group>
  );
}

function ParticleField({ count = 200, compact = false }) {
  const pointsRef = useRef();
  const { useFrame } = require("@react-three/fiber");

  const actualCount = compact ? Math.floor(count * 0.4) : count;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(actualCount * 3);
    const vel = new Float32Array(actualCount * 3);
    const range = compact ? 4 : 8;
    for (let i = 0; i < actualCount; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * range;
      pos[i * 3 + 1] = (Math.random() - 0.5) * range;
      pos[i * 3 + 2] = (Math.random() - 0.5) * range * 0.5;
      vel[i * 3]     = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    return [pos, vel];
  }, [actualCount, compact]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posArr = pointsRef.current.geometry.attributes.position.array;
    const limit = compact ? 4 : 8;
    for (let i = 0; i < actualCount; i++) {
      posArr[i * 3]     += vel[i * 3];
      posArr[i * 3 + 1] += vel[i * 3 + 1];
      posArr[i * 3 + 2] += vel[i * 3 + 2];
      /* wrap around */
      if (Math.abs(posArr[i * 3])     > limit) vel[i * 3]     *= -1;
      if (Math.abs(posArr[i * 3 + 1]) > limit) vel[i * 3 + 1] *= -1;
      if (Math.abs(posArr[i * 3 + 2]) > limit * 0.5) vel[i * 3 + 2] *= -1;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={actualCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={BLUE}
        size={0.02}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function DepthGrid() {
  return (
    <group position={[0, 0, -2]} rotation={[0, 0, 0]}>
      <gridHelper
        args={[20, 30, BLUE, BLUE]}
        rotation={[Math.PI / 2, 0, 0]}
        material-transparent
        material-opacity={0.03}
      />
    </group>
  );
}

function CameraDrift() {
  const { useFrame, useThree } = require("@react-three/fiber");
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.05) * 0.3;
    camera.position.y = Math.cos(t * 0.07) * 0.2;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function PhotonScene({ compact = false }) {
  const scaleAll = compact ? 0.7 : 1;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.3} color={BLUE} />
      <pointLight position={[-5, -3, 3]} intensity={0.2} color={CYAN} />

      <group scale={[scaleAll, scaleAll, scaleAll]}>
        {/* Depth grid */}
        <DepthGrid />

        {/* Particle field */}
        <ParticleField count={compact ? 80 : 200} compact={compact} />

        {/* Network nodes */}
        {NETWORK_NODES.map((node, i) => (
          <NetworkNode
            key={node.id}
            position={node.pos}
            size={node.size}
            isJunction={node.junction}
            color={node.id === "phot" ? CYAN : BLUE}
          />
        ))}

        {/* Connections with light pulses */}
        {CONNECTIONS.map(([a, b], i) => (
          <ConnectionPath
            key={`${a}-${b}`}
            start={NETWORK_NODES[a].pos}
            end={NETWORK_NODES[b].pos}
            index={i}
          />
        ))}
      </group>

      {/* Subtle camera drift */}
      <CameraDrift />
    </>
  );
}

/* ─── CSS fallback when WebGL is unavailable ─── */
function CSSFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Radial gradient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-pulse-soft"
        style={{
          background: `radial-gradient(circle, rgba(83,184,255,0.08) 0%, rgba(99,240,224,0.04) 40%, transparent 70%)`,
        }}
      />

      {/* Animated dots representing network nodes */}
      {[
        { x: "25%", y: "30%", delay: "0s",    size: 6  },
        { x: "60%", y: "25%", delay: "0.5s",  size: 5  },
        { x: "45%", y: "55%", delay: "1s",    size: 8  },
        { x: "75%", y: "50%", delay: "0.3s",  size: 5  },
        { x: "35%", y: "70%", delay: "0.8s",  size: 4  },
        { x: "55%", y: "40%", delay: "1.2s",  size: 7  },
        { x: "20%", y: "55%", delay: "0.6s",  size: 4  },
        { x: "70%", y: "70%", delay: "1.5s",  size: 5  },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse-soft"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            background: i % 2 === 0 ? BLUE : CYAN,
            boxShadow: `0 0 ${dot.size * 3}px ${i % 2 === 0 ? BLUE : CYAN}`,
            animationDelay: dot.delay,
          }}
        />
      ))}

      {/* Subtle connecting lines via SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="25%" y1="30%" x2="45%" y2="55%" stroke={BLUE} strokeWidth="1" />
        <line x1="60%" y1="25%" x2="45%" y2="55%" stroke={BLUE} strokeWidth="1" />
        <line x1="75%" y1="50%" x2="45%" y2="55%" stroke={CYAN} strokeWidth="1" />
        <line x1="35%" y1="70%" x2="45%" y2="55%" stroke={BLUE} strokeWidth="1" />
        <line x1="55%" y1="40%" x2="45%" y2="55%" stroke={CYAN} strokeWidth="1" />
        <line x1="20%" y1="55%" x2="45%" y2="55%" stroke={BLUE} strokeWidth="1" />
        <line x1="70%" y1="70%" x2="45%" y2="55%" stroke={CYAN} strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ─── Error boundary for WebGL failures ─── */
class WebGLErrorBoundary extends require("react").Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err, info) {
    console.warn("[PhotonNetwork] WebGL error, falling back to CSS:", err);
  }
  render() {
    if (this.state.hasError) {
      return <CSSFallback />;
    }
    return this.props.children;
  }
}

/* ─── Detect WebGL support ─── */
function supportsWebGL() {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/* ─── Detect reduced-motion preference ─── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ─── Detect mobile for reduced complexity ─── */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

/* ─── Dynamic Canvas import (SSR-safe) ─── */
const ThreeCanvas = dynamic(
  () => import("@react-three/fiber").then((mod) => {
    const { Canvas } = mod;

    function WrappedCanvas({ compact, isMobile, children, ...props }) {
      return (
        <Canvas
          camera={{ position: [0, 0, compact ? 5 : 7], fov: 50 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
          }}
          style={{ width: "100%", height: "100%" }}
          {...props}
        >
          <PhotonScene compact={compact || isMobile} />
        </Canvas>
      );
    }

    return WrappedCanvas;
  }),
  {
    ssr: false,
    loading: () => <CSSFallback />,
  }
);

/* ─── Exported PhotonNetwork component ─── */
export default function PhotonNetwork({ compact = false, className = "" }) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    if (!supportsWebGL()) {
      setWebglOk(false);
    }
  }, []);

  /* If user prefers reduced motion or WebGL unavailable, show CSS fallback */
  if (reducedMotion || !webglOk) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <CSSFallback />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <WebGLErrorBoundary>
        <ThreeCanvas compact={compact} isMobile={isMobile} />
      </WebGLErrorBoundary>
    </div>
  );
}
