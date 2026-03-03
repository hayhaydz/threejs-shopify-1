'use client';

import { useCart } from '@/hooks/useCart';

export function CartBadge() {
  const { itemCount } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed left-4 top-4 rounded-full bg-black px-4 py-2 text-white shadow-lg">
      Cart: {itemCount} {itemCount === 1 ? 'item' : 'items'}
    </div>
  );
}
