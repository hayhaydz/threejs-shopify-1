'use client';

import { useRef, forwardRef } from 'react';
import * as THREE from 'three';
import { ShopifyProduct } from '@/types/shopify';

// Generate consistent colors based on product ID
function getProductColor(id: string): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Gold
    '#BB8FCE', // Purple
    '#85C1E9', // Light Blue
  ];

  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

interface ProductProps {
  product: ShopifyProduct;
  position: [number, number, number];
}

export const Product = forwardRef<THREE.Mesh, ProductProps>(
  function Product({ product, position }, ref) {
    const variant = product.variants.edges[0]?.node;
    const color = getProductColor(product.id);

    return (
      <mesh
        ref={ref}
        position={position}
        castShadow
        userData={{
          shopifyId: variant?.id,
          productId: product.id,
          title: product.title,
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
);

export type ProductHandle = THREE.Mesh;
