'use client';

import Image from "next/image";
import { useCart } from "@/hooks/useCart";

export default function Home() {
  const { products, cart, isLoading, error, addToCart, removeFromCart, itemCount, checkoutUrl } = useCart();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800 mx-auto dark:border-zinc-700 dark:border-t-zinc-200" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h1 className="mb-2 text-xl font-semibold text-red-600 dark:text-red-400">
            Failed to Load
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{error}</p>
          <div className="text-sm text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg">
            <p className="font-medium mb-2">Possible causes:</p>
            <ul className="text-left list-disc list-inside space-y-1">
              <li>Missing environment variables in <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">.env.local</code></li>
              <li>Invalid Shopify store domain or API token</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Helper to check if variant is in cart
  const getCartLineForVariant = (variantId: string) => {
    return cart?.lines.edges.find(edge => edge.node.merchandise.id === variantId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header with cart badge */}
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Shopify Integration Test
          </h1>
          <div className="flex items-center gap-4">
            {/* Cart badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <span className="text-lg">🛒</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{itemCount}</span>
            </div>
            {/* Checkout button */}
            {checkoutUrl && itemCount > 0 && (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Checkout →
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Products grid */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            Products ({products.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const firstImage = product.images.edges[0]?.node;
              const firstVariant = product.variants.edges[0]?.node;
              const cartLine = firstVariant ? getCartLineForVariant(firstVariant.id) : null;

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                >
                  {/* Product image */}
                  <div className="aspect-square relative bg-zinc-100 dark:bg-zinc-800">
                    {firstImage ? (
                      <Image
                        src={firstImage.url}
                        alt={firstImage.altText || product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="p-3">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                      {product.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                      {firstVariant?.price.currencyCode} {firstVariant?.price.amount}
                    </p>

                    {/* Add/Remove button */}
                    {firstVariant?.availableForSale ? (
                      cartLine ? (
                        <button
                          onClick={() => removeFromCart(cartLine.node.id)}
                          className="w-full py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Remove from Cart ({cartLine.node.quantity})
                        </button>
                      ) : (
                        <button
                          onClick={() => addToCart(firstVariant.id)}
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Add to Cart
                        </button>
                      )
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 px-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-lg font-medium cursor-not-allowed"
                      >
                        Sold Out
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cart contents */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            Cart Contents ({itemCount} items)
          </h2>

          {cart && cart.lines.edges.length > 0 ? (
            <>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 mb-4">
                {cart.lines.edges.map(({ node: line }) => (
                  <li key={line.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {line.merchandise.product.title}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {line.merchandise.title} × {line.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(line.id)}
                      className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              {/* Cart total */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  Total: {cart.cost.totalAmount.currencyCode} {cart.cost.totalAmount.amount}
                </p>
                {checkoutUrl && (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Proceed to Checkout →
                  </a>
                )}
              </div>
            </>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-500 text-center py-8">
              Your cart is empty. Add products above to get started.
            </p>
          )}
        </section>

        {/* Debug info */}
        <section className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Debug Info
          </h3>
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500 space-y-1">
            <p>Cart ID: {cart?.id || 'None'}</p>
            <p>Products loaded: {products.length}</p>
            <p>Cart items: {itemCount}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
