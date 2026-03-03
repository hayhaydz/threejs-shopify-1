'use client';

import { RigidBody } from '@react-three/rapier';

export function Floor() {
  return (
    <RigidBody type="fixed" colliders="hull">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2d2d44" />
      </mesh>
    </RigidBody>
  );
}
