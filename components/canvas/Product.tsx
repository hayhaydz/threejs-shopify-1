'use client';

import { forwardRef } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { ShopifyProduct } from '@/types/shopify';

// Generate consistent colors based on product ID
function getProductColor(id: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  ];

  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

interface ProductProps {
  product: ShopifyProduct;
  position: [number, number, number];
  isDragging?: boolean;
}

export const Product = forwardRef<RapierRigidBody, ProductProps>(
  function Product({ product, position, isDragging = false }, ref) {
    const variant = product.variants.edges[0]?.node;
    const color = getProductColor(product.id);

    return (
      <RigidBody
        ref={ref}
        position={position}
        type={isDragging ? 'kinematicPosition' : 'dynamic'}
        userData={{
          shopifyId: variant?.id,
          productId: product.id,
          title: product.title,
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </RigidBody>
    );
  }
);

export type ProductHandle = RapierRigidBody;
