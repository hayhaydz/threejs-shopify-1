"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";

export function Floor() {
	return (
		<RigidBody type="fixed" position={[0, -2, 0]}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[20, 20]} />
				<meshStandardMaterial color="#2d2d44" />
			</mesh>
			{/* Explicit thick collider for better stability */}
			<CuboidCollider args={[10, 0.1, 10]} position={[0, -0.1, 0]} />
		</RigidBody>
	);
}
