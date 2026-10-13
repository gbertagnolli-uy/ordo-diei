"use client";

// Regalo 3D (public/models/present_1_low_poly.glb) para el modal de premio sorpresa.
// Gira lento, acelera cada vez más y avisa con onExplotar cuando llegó al tope y el premio ya está listo.
// Si el .glb no está o falla, dibuja un regalo simple para que la animación nunca quede vacía.
import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export const URL_REGALO = "/models/present_1_low_poly.glb";

const T_LENTO = 2; // s girando lento
const T_EXPLOSION = 5.5; // s en los que ya alcanzó la velocidad máxima
const W_LENTO = 1.2; // rad/s
const W_MAX = 32; // rad/s

/** Velocidad angular según el tiempo: lenta, luego exponencial hasta el tope */
export function velocidadAngular(t: number, reducida: boolean): number {
  if (reducida) return W_LENTO * 2;
  if (t < T_LENTO) return W_LENTO;
  return Math.min(W_MAX, W_LENTO * Math.exp((t - T_LENTO) * 1.0));
}

class Limite extends Component<{ fallback: ReactNode; children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

function RegaloModelo() {
  const { scene } = useGLTF(URL_REGALO);
  // Centrado y escalado a un tamaño fijo, sea cual sea la unidad con que se exportó el modelo
  const { objeto, escala } = useMemo(() => {
    const clon = scene.clone(true);
    const caja = new THREE.Box3().setFromObject(clon);
    const centro = caja.getCenter(new THREE.Vector3());
    const tam = caja.getSize(new THREE.Vector3());
    clon.position.sub(centro);
    return { objeto: clon, escala: 2.0 / (Math.max(tam.x, tam.y, tam.z) || 1) };
  }, [scene]);
  // El escalado va en un grupo aparte: si fuera el del propio objeto, el desplazamiento de centrado
  // (en unidades originales) no se reduciría y el modelo quedaría fuera de cámara.
  return (
    <group scale={escala}>
      <primitive object={objeto} />
    </group>
  );
}

function RegaloSimple() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1.6, 1.3, 1.6]} />
        <meshStandardMaterial color="#e11d48" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.8, 0.3, 1.8]} />
        <meshStandardMaterial color="#be123c" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.28, 1.35, 1.65]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.65, 1.35, 0.28]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.15, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.28, 0.1, 12, 24]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Girador({ listo, reducida, onExplotar }: { listo: boolean; reducida: boolean; onExplotar: () => void }) {
  const grupo = useRef<THREE.Group>(null);
  const t = useRef(0);
  const angulo = useRef(0);
  const avisado = useRef(false);

  useFrame((_, dt) => {
    const g = grupo.current;
    if (!g) return;
    const paso = Math.min(dt, 0.05); // un salto de pestaña no debe teletransportar la animación
    t.current += paso;
    angulo.current += velocidadAngular(t.current, reducida) * paso;
    g.rotation.y = angulo.current;

    // Crece y tiembla un poco a medida que se acerca la explosión
    const tension = reducida ? 0 : THREE.MathUtils.clamp((t.current - T_LENTO) / (T_EXPLOSION - T_LENTO), 0, 1);
    g.scale.setScalar(1 + tension * 0.22 + Math.sin(t.current * 40) * 0.012 * tension);

    const tope = reducida ? 1.2 : T_EXPLOSION;
    if (!avisado.current && listo && t.current >= tope) {
      avisado.current = true;
      onExplotar();
    }
  });

  return (
    <group ref={grupo} rotation={[0.25, 0, 0]}>
      <Limite fallback={<RegaloSimple />}>
        <Suspense fallback={null}>
          <RegaloModelo />
        </Suspense>
      </Limite>
    </group>
  );
}

export default function Regalo3D({ listo, reducida, onExplotar }: { listo: boolean; reducida: boolean; onExplotar: () => void }) {
  return (
    <Canvas camera={{ position: [0, 0.6, 5.2], fov: 40 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} />
      <directionalLight position={[-4, 1, -3]} intensity={1} color="#a5b4fc" />
      <Girador listo={listo} reducida={reducida} onExplotar={onExplotar} />
    </Canvas>
  );
}
