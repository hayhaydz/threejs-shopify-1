"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { useCart } from "@/hooks/useCart";

const BASKET_POSITION: [number, number, number] = [0, -1.5, 4];
const BASKET_SIZE = { width: 3, height: 1.5, depth: 2 };

export function Basket() {
	const { addToCart, removeFromCart, cart } = useCart();
	const productsInBasket = useRef(new Set<string>());

	return (
		<RigidBody type="fixed" position={BASKET_POSITION}>
			{/* Visual basket (wireframe) */}
			<mesh>
				<boxGeometry
					args={[BASKET_SIZE.width, BASKET_SIZE.height, BASKET_SIZE.depth]}
				/>
				<meshStandardMaterial color="#8B4513" wireframe />
			</mesh>

			{/* Wall colliders (invisible, keep products inside) */}
			{/* Bottom */}
			<CuboidCollider
				args={[BASKET_SIZE.width / 2, 0.1, BASKET_SIZE.depth / 2]}
				position={[0, -BASKET_SIZE.height / 2, 0]}
			/>

			{/* Left wall */}
			<CuboidCollider
				args={[0.1, BASKET_SIZE.height / 2, BASKET_SIZE.depth / 2]}
				position={[-BASKET_SIZE.width / 2, 0, 0]}
			/>

			{/* Right wall */}
			<CuboidCollider
				args={[0.1, BASKET_SIZE.height / 2, BASKET_SIZE.depth / 2]}
				position={[BASKET_SIZE.width / 2, 0, 0]}
			/>

			{/* Front wall */}
			<CuboidCollider
				args={[BASKET_SIZE.width / 2, BASKET_SIZE.height / 2, 0.1]}
				position={[0, 0, BASKET_SIZE.depth / 2]}
			/>

			{/* Back wall */}
			<CuboidCollider
				args={[BASKET_SIZE.width / 2, BASKET_SIZE.height / 2, 0.1]}
				position={[0, 0, -BASKET_SIZE.depth / 2]}
			/>

			{/* Sensor - detects products entering basket */}
			<CuboidCollider
				args={[
					BASKET_SIZE.width / 2 - 0.2,
					BASKET_SIZE.height / 2 - 0.2,
					BASKET_SIZE.depth / 2 - 0.2,
				]}
				position={[0, 0, 0]}
				sensor
				onIntersectionEnter={({ other }) => {
					const variantId = other.rigidBodyObject?.userData?.shopifyId as
						| string
						| undefined;

					if (variantId && !productsInBasket.current.has(variantId)) {
						productsInBasket.current.add(variantId);
						console.log("Product entered basket:", variantId);
						addToCart(variantId, 1).catch(console.error);
					}
				}}
				onIntersectionExit={({ other }) => {
					const variantId = other.rigidBodyObject?.userData?.shopifyId as
						| string
						| undefined;

					if (variantId) {
						productsInBasket.current.delete(variantId);

						// Find the line ID for this variant
						const line = cart?.lines.edges.find(
							(edge) => edge.node.merchandise.id === variantId,
						);

						if (line) {
							console.log("Product left basket:", variantId);
							removeFromCart(line.node.id).catch(console.error);
						}
					}
				}}
			/>
		</RigidBody>
	);
}
