"use client";

import { Float, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { forwardRef, useRef, useState, useMemo } from "react";
import * as THREE from "three";

export const TestBox = forwardRef<RapierRigidBody, { position: [number, number, number] }>(
	function TestBox({ position: initialPos }, ref) {
		const { camera, raycaster, mouse } = useThree();
		const [isDragging, setIsDragging] = useState(false);
		const [isHovered, setIsHovered] = useState(false);
		
		const localRbRef = useRef<RapierRigidBody>(null);
		const rbRef = (ref as React.RefObject<RapierRigidBody>) || localRbRef;
		const shadowRef = useRef<THREE.Mesh>(null);
		
		// HOVER HEIGHT
		const HOVER_Y = 1.5;

		// Plane for X/Z dragging (Horizontal)
		const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
		const dragOffset = useMemo(() => new THREE.Vector3(), []);
		const targetPoint = useMemo(() => new THREE.Vector3(), []);
		const intersection = useMemo(() => new THREE.Vector3(), []);

		const handlePointerDown = (e: any) => {
			e.stopPropagation();
			if (!rbRef.current) return;

			setIsDragging(true);
			document.body.style.cursor = "grabbing";

			const currentPos = rbRef.current.translation();
			const worldPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
			
			// We drag on a plane at the target HOVER height
			dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, HOVER_Y, 0));

			if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
				dragOffset.copy(worldPos).sub(intersection);
				// We want to snap Y to HOVER_Y, but keep X/Z offset
				dragOffset.y = 0; 
			}
		};

		const handlePointerUp = () => {
			if (isDragging) {
				setIsDragging(false);
				document.body.style.cursor = isHovered ? "grab" : "auto";
				if (rbRef.current) {
					rbRef.current.wakeUp();
				}
			}
		};

		useFrame((state) => {
			const currentPos = rbRef.current?.translation();
			if (!currentPos) return;

			// Update Shadow Marker Position (always on the floor)
			if (shadowRef.current) {
				shadowRef.current.position.set(currentPos.x, -1.99, currentPos.z);
				// Scale shadow based on height
				const height = currentPos.y + 2; // relative to floor
				const scale = Math.max(0.2, 1 - (height * 0.2));
				shadowRef.current.scale.set(scale, scale, 1);
				shadowRef.current.visible = true;
			}

			if (isDragging && rbRef.current) {
				raycaster.setFromCamera(mouse, camera);
				if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
					targetPoint.copy(intersection).add(dragOffset);
					targetPoint.y = HOVER_Y; // FORCE hover height

					const currentVec = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
					
					const speedFactor = 20; 
					const velX = (targetPoint.x - currentVec.x) * speedFactor;
					const velY = (targetPoint.y - currentVec.y) * speedFactor;
					const velZ = (targetPoint.z - currentVec.z) * speedFactor;

					rbRef.current.setLinvel({ x: velX, y: velY, z: velZ }, true);
                    rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
                    rbRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
				}
			}
		});

		return (
			<>
				{/* The Shadow Marker */}
				<mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.6, 32]} />
					<meshBasicMaterial color="black" transparent opacity={0.4} />
				</mesh>

				<RigidBody
					ref={rbRef}
					position={initialPos}
					type="dynamic"
					colliders="cuboid"
					linearDamping={isDragging ? 10 : 0.5}
					angularDamping={isDragging ? 10 : 10} // keep it very stable
					ccd={true}
					onPointerDown={handlePointerDown}
					onPointerUp={handlePointerUp}
					onPointerOver={(e) => {
						e.stopPropagation();
						setIsHovered(true);
						document.body.style.cursor = isDragging ? "grabbing" : "grab";
					}}
					onPointerOut={() => {
						if (!isDragging) {
							setIsHovered(false);
							document.body.style.cursor = "auto";
						}
					}}
				>
					<mesh castShadow>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial 
							color={isHovered ? "gold" : "#BB8FCE"} 
							emissive={isHovered ? "gold" : "black"}
							emissiveIntensity={isHovered ? 0.3 : 0}
						/>
					</mesh>

					<Float speed={2} floatIntensity={0.5}>
						<Text
							position={[0, 1.2, 0]}
							fontSize={0.3}
							color="white"
							anchorX="center"
							anchorY="middle"
						>
							Floaty Drag
						</Text>
					</Float>
				</RigidBody>
			</>
		);
	},
);
