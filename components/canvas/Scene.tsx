"use client";

import { DragControls, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useCart } from "@/hooks/useCart";
import { Basket } from "./Basket";
import { Floor } from "./Floor";
import { Product } from "./Product";

// Calculate grid positions for products
function calculateGridPositions(count: number): [number, number, number][] {
	const positions: [number, number, number][] = [];
	const columns = 3;
	const spacing = 2;

	for (let i = 0; i < count; i++) {
		const row = Math.floor(i / columns);
		const col = i % columns;
		const x = (col - (columns - 1) / 2) * spacing;
		const z = row * spacing - 2;
		positions.push([x, 1, z]); // y=1 so products fall from above
	}

	return positions;
}

export function Scene() {
	const { products } = useCart();
	const positions = calculateGridPositions(products.length);

	return (
		<Canvas
			shadows
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

			{/* Camera controls - limited for better UX */}
			<OrbitControls
				enableZoom={true}
				enablePan={false}
				minPolarAngle={Math.PI / 4}
				maxPolarAngle={Math.PI / 2.5}
				minDistance={5}
				maxDistance={15}
			/>

			{/* Draggable Products */}
			<DragControls
				onDragStart={() => {
					document.body.style.cursor = "grabbing";
				}}
				onDragEnd={() => {
					document.body.style.cursor = "default";
				}}
			>
				{products.map((product, index) => (
					<Product
						key={product.id}
						product={product}
						position={positions[index] || [0, 0, 0]}
					/>
				))}
			</DragControls>

			{/* Physics world */}
			<Physics debug={false}>
				{/* Basket (physics-enabled) */}
				<Basket />

				{/* Floor (physics-enabled) */}
				<Floor />
			</Physics>
		</Canvas>
	);
}
