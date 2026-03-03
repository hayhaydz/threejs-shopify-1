'use client';

import dynamic from 'next/dynamic';
import { useCart } from '@/hooks/useCart';
import { CartBadge } from '@/components/ui/CartBadge';
import { CheckoutButton } from '@/components/ui/CheckoutButton';

// Dynamic import to avoid SSR issues with Three.js
const Scene = dynamic(
  () => import('@/components/canvas/Scene').then((mod) => mod.Scene),
  { ssr: false }
);

export default function Home() {
  const { isLoading, error } = useCart();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1a1a2e]">
        <p className="text-white">Loading products...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1a1a2e]">
        <p className="text-red-500">Error: {error}</p>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* 3D Canvas */}
      <Scene />

      {/* UI Overlay */}
      <CartBadge />
      <CheckoutButton />

      {/* Instructions */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-4 py-2 text-sm text-white">
        🎮 Drag products and drop them in the basket to add to cart!
      </div>
    </main>
  );
}
