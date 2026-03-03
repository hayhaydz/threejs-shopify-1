'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useCart } from '@/hooks/useCart';
import { Product } from './Product';
import { Floor } from './Floor';

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
    positions.push([x, 0, z]);
  }

  return positions;
}

export function Scene() {
  const { products } = useCart();
  const positions = calculateGridPositions(products.length);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 8], fov: 50 }}
      style={{ background: '#1a1a2e' }}
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

      {/* Products */}
      {products.map((product, index) => (
        <Product
          key={product.id}
          product={product}
          position={positions[index] || [0, 0, 0]}
        />
      ))}

      {/* Floor */}
      <Floor />
    </Canvas>
  );
}
