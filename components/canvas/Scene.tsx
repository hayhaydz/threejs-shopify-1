"use client";

import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { Suspense } from "react";
import { TestBox } from "./TestBox";

export function Scene() {
    return (
        <Canvas
            shadows
            gl={{
                antialias: true,
                powerPreference: "high-performance",
            }}
            camera={{ position: [0, 5, 12], fov: 50 }}
            style={{ background: "#1a1a2e" }}
        >
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />

            <Suspense fallback={null}>
                <Physics debug={true} substeps={6}>
                    <TestBox position={[0, 5, 0]} />

                    {/* Floor */}
                    <RigidBody type="fixed" position={[0, -2, 0]}>
                        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                            <planeGeometry args={[20, 20]} />
                            <meshStandardMaterial color="#2d2d44" />
                        </mesh>
                    </RigidBody>
                </Physics>
            </Suspense>
        </Canvas>
    );
}
