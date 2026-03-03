# R3F + Shopify Drag-and-Drop Cart Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a physics-based drag-and-drop shopping cart with React Three Fiber and Shopify Storefront API.

**Architecture:** Layered foundation — Shopify first, then 3D scene, drag interactions, physics, and finally polish. Each layer builds on the previous with clear success criteria.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Three.js, @react-three/fiber, @react-three/drei, @react-three/rapier, Shopify Storefront API (GraphQL)

---

## Phase 0: Project Setup

### Task 0.1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `app/`, `tsconfig.json`, etc.

**Step 1: Create Next.js app**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Select options:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: `@/*`

Expected: Project scaffolding created with `app/`, `package.json`, `tsconfig.json`

**Step 2: Verify project runs**

Run:
```bash
npm run dev
```

Expected: Dev server starts at http://localhost:3000, page loads with Next.js logo

**Step 3: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 0.2: Install 3D and Physics Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install R3F dependencies**

Run:
```bash
npm install three @react-three/fiber @react-three/drei @react-three/rapier
```

Expected: Dependencies added to package.json

**Step 2: Install TypeScript types for Three.js**

Run:
```bash
npm install -D @types/three
```

Expected: @types/three added to devDependencies

**Step 3: Verify no type errors**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors (or only unrelated warnings)

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add R3F, drei, and rapier dependencies"
```

---

### Task 0.3: Set Up Environment Variables

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Create .env.local with Shopify credentials**

Create `.env.local`:
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=421be8ded961bb6fa1d209d72596be75
```

Expected: File created (will NOT be committed)

**Step 2: Create .env.example for documentation**

Create `.env.example`:
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
```

Expected: File created (WILL be committed as documentation)

**Step 3: Ensure .env.local is in .gitignore**

`.gitignore` should already include:
```
.env*.local
```

If not, add it.

**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add environment configuration template"
```

---

## Layer 1: Shopify Foundation

### Task 1.1: Create Shopify TypeScript Types

**Files:**
- Create: `types/shopify.ts`

**Step 1: Create types file**

Create `types/shopify.ts`:
```typescript
// Product types
export interface ShopifyImage {
  id: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  availableForSale: boolean;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: {
    edges: Array<{
      node: ShopifyImage;
    }>;
  };
  variants: {
    edges: Array<{
      node: ShopifyVariant;
    }>;
  };
}

// Cart types
export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: Array<{
      node: CartLine;
    }>;
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

// API response types
export interface ProductsResponse {
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

export interface CartResponse {
  cart: ShopifyCart | null;
}

export interface CreateCartResponse {
  cartCreate: {
    cart: ShopifyCart;
    userErrors: Array<{
      message: string;
    }>;
  };
}

export interface AddToCartResponse {
  cartLinesAdd: {
    cart: ShopifyCart;
    userErrors: Array<{
      message: string;
    }>;
  };
}

export interface RemoveFromCartResponse {
  cartLinesRemove: {
    cart: ShopifyCart;
    userErrors: Array<{
      message: string;
    }>;
  };
}
```

Expected: File created with all type definitions

**Step 2: Verify types compile**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add types/shopify.ts
git commit -m "feat: add Shopify TypeScript types"
```

---

### Task 1.2: Create Shopify GraphQL Client

**Files:**
- Create: `lib/shopify.ts`

**Step 1: Create Shopify client with fetch helper**

Create `lib/shopify.ts`:
```typescript
import {
  ShopifyProduct,
  ShopifyCart,
  ProductsResponse,
  CartResponse,
  CreateCartResponse,
  AddToCartResponse,
  RemoveFromCartResponse,
} from '@/types/shopify';

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

const SHOPIFY_GRAPHQL_URL = `https://${STORE_DOMAIN}/api/2024-01/graphql.json`;

async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

// GraphQL Queries
const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          images(first: 1) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

const CREATE_CART_MUTATION = `
  mutation CreateCart {
    cartCreate {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        message
      }
    }
  }
`;

const GET_CART_QUERY = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  title
                }
              }
            }
          }
        }
      }
      cost {
        totalAmount {
          amount
          currencyCode
        }
      }
    }
  }
`;

const ADD_TO_CART_MUTATION = `
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        message
      }
    }
  }
`;

const REMOVE_FROM_CART_MUTATION = `
  mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        message
      }
    }
  }
`;

// Exported API functions
export async function getProducts(first: number = 10): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<ProductsResponse>(GET_PRODUCTS_QUERY, { first });
  return data.products.edges.map((edge) => edge.node);
}

export async function createCart(): Promise<ShopifyCart> {
  const data = await shopifyFetch<CreateCartResponse>(CREATE_CART_MUTATION);

  if (data.cartCreate.userErrors.length > 0) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }

  return data.cartCreate.cart;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<CartResponse>(GET_CART_QUERY, { cartId });
  return data.cart;
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<ShopifyCart> {
  const data = await shopifyFetch<AddToCartResponse>(ADD_TO_CART_MUTATION, {
    cartId,
    lines: [{ merchandiseId: variantId, quantity }],
  });

  if (data.cartLinesAdd.userErrors.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors[0].message);
  }

  return data.cartLinesAdd.cart;
}

export async function removeFromCart(
  cartId: string,
  lineId: string
): Promise<ShopifyCart> {
  const data = await shopifyFetch<RemoveFromCartResponse>(REMOVE_FROM_CART_MUTATION, {
    cartId,
    lineIds: [lineId],
  });

  if (data.cartLinesRemove.userErrors.length > 0) {
    throw new Error(data.cartLinesRemove.userErrors[0].message);
  }

  return data.cartLinesRemove.cart;
}
```

Expected: File created with all Shopify API functions

**Step 2: Verify types compile**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add lib/shopify.ts
git commit -m "feat: add Shopify GraphQL client with cart operations"
```

---

### Task 1.3: Create useCart Hook

**Files:**
- Create: `hooks/useCart.ts`

**Step 1: Create cart context and hook**

Create `hooks/useCart.ts`:
```typescript
'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  ShopifyCart,
  ShopifyProduct,
  getProducts,
  createCart,
  getCart,
  addToCart as shopifyAddToCart,
  removeFromCart as shopifyRemoveFromCart,
} from '@/lib/shopify';

interface CartContextType {
  products: ShopifyProduct[];
  cart: ShopifyCart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  itemCount: number;
  checkoutUrl: string | null;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_ID_KEY = 'shopify_cart_id';

export function CartProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize: fetch products and restore/create cart
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);

        // Fetch products
        const fetchedProducts = await getProducts(10);
        setProducts(fetchedProducts);

        // Restore or create cart
        const savedCartId = localStorage.getItem(CART_ID_KEY);
        if (savedCartId) {
          const existingCart = await getCart(savedCartId);
          if (existingCart) {
            setCart(existingCart);
            setIsLoading(false);
            return;
          }
        }

        // Create new cart if none exists
        const newCart = await createCart();
        localStorage.setItem(CART_ID_KEY, newCart.id);
        setCart(newCart);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  const addToCart = useCallback(async (variantId: string, quantity: number = 1) => {
    if (!cart) return;

    try {
      setError(null);
      const updatedCart = await shopifyAddToCart(cart.id, variantId, quantity);
      setCart(updatedCart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
      throw err;
    }
  }, [cart]);

  const removeFromCart = useCallback(async (lineId: string) => {
    if (!cart) return;

    try {
      setError(null);
      const updatedCart = await shopifyRemoveFromCart(cart.id, lineId);
      setCart(updatedCart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from cart');
      throw err;
    }
  }, [cart]);

  const itemCount = cart?.lines.edges.reduce((sum, edge) => sum + edge.node.quantity, 0) ?? 0;
  const checkoutUrl = cart?.checkoutUrl ?? null;

  return (
    <CartContext.Provider
      value={{
        products,
        cart,
        isLoading,
        error,
        addToCart,
        removeFromCart,
        itemCount,
        checkoutUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
```

Expected: File created with CartProvider and useCart hook

**Step 2: Verify types compile**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add hooks/useCart.ts
git commit -m "feat: add useCart hook with CartProvider"
```

---

### Task 1.4: Integrate CartProvider into Layout

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Update layout with CartProvider**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '3D Shop',
  description: 'Physics-based drag-and-drop shopping cart',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
```

Expected: Layout updated with CartProvider wrapper

**Step 2: Verify app still runs**

Run:
```bash
npm run dev
```

Expected: App loads without errors

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: integrate CartProvider into root layout"
```

---

### Task 1.5: Create Test Page to Verify Shopify Integration

**Files:**
- Modify: `app/page.tsx`

**Step 1: Create test page with product list**

Replace `app/page.tsx`:
```tsx
'use client';

import { useCart } from '@/hooks/useCart';

export default function Home() {
  const { products, cart, isLoading, error, addToCart, removeFromCart, itemCount, checkoutUrl } = useCart();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-4">
          <span className="rounded bg-gray-100 px-4 py-2">
            Cart: {itemCount} items
          </span>
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Checkout
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const variant = product.variants.edges[0]?.node;
          const image = product.images.edges[0]?.node;
          const cartLine = cart?.lines.edges.find(
            (edge) => edge.node.merchandise.id === variant?.id
          );

          return (
            <div key={product.id} className="rounded border p-4">
              {image && (
                <img
                  src={image.url}
                  alt={image.altText || product.title}
                  className="mb-2 h-48 w-full rounded object-cover"
                />
              )}
              <h2 className="font-semibold">{product.title}</h2>
              <p className="text-sm text-gray-600">
                {variant?.price.currencyCode} {variant?.price.amount}
              </p>

              {cartLine ? (
                <button
                  onClick={() => removeFromCart(cartLine.node.id)}
                  className="mt-2 w-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                  Remove from Cart ({cartLine.node.quantity})
                </button>
              ) : (
                <button
                  onClick={() => variant && addToCart(variant.id)}
                  disabled={!variant?.availableForSale}
                  className="mt-2 w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {variant?.availableForSale ? 'Add to Cart' : 'Sold Out'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {cart && cart.lines.edges.length > 0 && (
        <div className="mt-8 rounded border p-4">
          <h2 className="mb-4 text-xl font-bold">Cart Contents</h2>
          <ul className="space-y-2">
            {cart.lines.edges.map((edge) => (
              <li key={edge.node.id} className="flex justify-between">
                <span>
                  {edge.node.merchandise.product.title} x {edge.node.quantity}
                </span>
                <button
                  onClick={() => removeFromCart(edge.node.id)}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold">
            Total: {cart.cost.totalAmount.currencyCode} {cart.cost.totalAmount.amount}
          </p>
        </div>
      )}
    </main>
  );
}
```

Expected: Test page showing products with add/remove buttons

**Step 2: Test in browser**

Run:
```bash
npm run dev
```

Open http://localhost:3000

Expected:
- Products display with images
- "Add to Cart" button works
- Cart count updates
- "Remove from Cart" works
- Checkout button redirects to Shopify

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add test page to verify Shopify integration"
```

---

## Layer 1 Checkpoint

**Verify before proceeding:**
- [ ] Products fetch from Shopify and display
- [ ] Add to cart works (cart count increases)
- [ ] Remove from cart works (cart count decreases)
- [ ] Checkout redirects to Shopify
- [ ] Cart persists across page refresh (localStorage)

---

## Layer 2: 3D Scene Setup

### Task 2.1: Create Floor Component

**Files:**
- Create: `components/canvas/Floor.tsx`

**Step 1: Create Floor component**

Create `components/canvas/Floor.tsx`:
```tsx
'use client';

import { mesh } from '@react-three/fiber';

export function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  );
}
```

Expected: Floor component created

**Step 2: Commit**

```bash
git add components/canvas/Floor.tsx
git commit -m "feat: add Floor component for 3D scene"
```

---

### Task 2.2: Create Product Mesh Component

**Files:**
- Create: `components/canvas/Product.tsx`

**Step 1: Create Product component**

Create `components/canvas/Product.tsx`:
```tsx
'use client';

import { useRef } from 'react';
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

export function Product({ product, position }: ProductProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const variant = product.variants.edges[0]?.node;
  const color = getProductColor(product.id);

  return (
    <mesh
      ref={meshRef}
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
```

Expected: Product component created with colored cubes

**Step 2: Commit**

```bash
git add components/canvas/Product.tsx
git commit -m "feat: add Product component with colored cubes"
```

---

### Task 2.3: Create Scene Component

**Files:**
- Create: `components/canvas/Scene.tsx`

**Step 1: Create Scene component with Canvas**

Create `components/canvas/Scene.tsx`:
```tsx
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
```

Expected: Scene component with Canvas, lighting, and products

**Step 2: Commit**

```bash
git add components/canvas/Scene.tsx
git commit -m "feat: add Scene component with Canvas and lighting"
```

---

### Task 2.4: Create CartBadge UI Component

**Files:**
- Create: `components/ui/CartBadge.tsx`

**Step 1: Create CartBadge component**

Create `components/ui/CartBadge.tsx`:
```tsx
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
```

Expected: CartBadge component created

**Step 2: Commit**

```bash
git add components/ui/CartBadge.tsx
git commit -m "feat: add CartBadge UI component"
```

---

### Task 2.5: Create CheckoutButton UI Component

**Files:**
- Create: `components/ui/CheckoutButton.tsx`

**Step 1: Create CheckoutButton component**

Create `components/ui/CheckoutButton.tsx`:
```tsx
'use client';

import { useCart } from '@/hooks/useCart';

export function CheckoutButton() {
  const { checkoutUrl, itemCount } = useCart();

  if (!checkoutUrl || itemCount === 0) return null;

  return (
    <a
      href={checkoutUrl}
      className="fixed right-4 top-4 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-green-700"
    >
      Checkout
    </a>
  );
}
```

Expected: CheckoutButton component created

**Step 2: Commit**

```bash
git add components/ui/CheckoutButton.tsx
git commit -m "feat: add CheckoutButton UI component"
```

---

### Task 2.6: Integrate 3D Scene into Page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace page with 3D scene**

Replace `app/page.tsx`:
```tsx
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
        Drag products into the basket (coming soon: physics + basket!)
      </div>
    </main>
  );
}
```

Expected: Page shows 3D scene with products

**Step 2: Test in browser**

Run:
```bash
npm run dev
```

Expected:
- 3D scene loads with colored cubes
- Camera can orbit around scene
- Cart badge and checkout button appear

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: integrate 3D scene into main page"
```

---

## Layer 2 Checkpoint

**Verify before proceeding:**
- [ ] 3D scene renders with colored cubes
- [ ] Products are positioned in a grid
- [ ] Camera can orbit (click + drag)
- [ ] Cart badge shows item count
- [ ] Checkout button appears when cart has items

---

## Layer 3: Drag & Drop (DragControls)

### Task 3.1: Add DragControls to Scene

**Files:**
- Modify: `components/canvas/Scene.tsx`

**Step 1: Add DragControls wrapper**

Update `components/canvas/Scene.tsx`:
```tsx
'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, DragControls } from '@react-three/drei';
import { useCart } from '@/hooks/useCart';
import { Product, ProductHandle } from './Product';
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
  const productRefs = useRef<THREE.Mesh[]>([]);

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

      {/* Drag controls */}
      <DragControls
        items={productRefs}
        onDragStart={() => {
          // Disable orbit while dragging
          document.body.style.cursor = 'grabbing';
        }}
        onDragEnd={() => {
          document.body.style.cursor = 'default';
        }}
      >
        {products.map((product, index) => (
          <Product
            key={product.id}
            product={product}
            position={positions[index] || [0, 0, 0]}
            ref={(el) => {
              if (el) productRefs.current[index] = el;
            }}
          />
        ))}
      </DragControls>

      {/* Camera controls - limited for better UX */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={5}
        maxDistance={15}
      />

      {/* Floor */}
      <Floor />
    </Canvas>
  );
}
```

**Step 2: Update Product to use forwardRef**

Update `components/canvas/Product.tsx`:
```tsx
'use client';

import { useRef, forwardRef } from 'react';
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
```

Expected: Products can be dragged with mouse

**Step 3: Test dragging**

Run:
```bash
npm run dev
```

Expected:
- Click and drag products to move them
- Products move on a horizontal plane

**Step 4: Commit**

```bash
git add components/canvas/Scene.tsx components/canvas/Product.tsx
git commit -m "feat: add DragControls for product dragging"
```

---

## Layer 3 Checkpoint

**Verify before proceeding:**
- [ ] Products can be dragged with mouse
- [ ] Cursor changes while dragging
- [ ] Orbit controls don't interfere with drag

---

## Layer 4: Physics with Rapier

### Task 4.1: Create Basket Component with Physics

**Files:**
- Create: `components/canvas/Basket.tsx`

**Step 1: Create Basket with walls and sensor**

Create `components/canvas/Basket.tsx`:
```tsx
'use client';

import { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useCart } from '@/hooks/useCart';

const BASKET_POSITION: [number, number, number] = [0, -1.5, 4];
const BASKET_SIZE = { width: 3, height: 1.5, depth: 2 };

export function Basket() {
  const { addToCart, removeFromCart, cart } = useCart();
  const productsInBasket = useRef(new Set<string>());

  // Get line IDs for products in cart
  const cartVariantIds = new Set(
    cart?.lines.edges.map((edge) => edge.node.merchandise.id) || []
  );

  return (
    <RigidBody type="fixed" position={BASKET_POSITION}>
      {/* Visual basket (wireframe) */}
      <mesh>
        <boxGeometry args={[BASKET_SIZE.width, BASKET_SIZE.height, BASKET_SIZE.depth]} />
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
        args={[BASKET_SIZE.width / 2 - 0.2, BASKET_SIZE.height / 2 - 0.2, BASKET_SIZE.depth / 2 - 0.2]}
        position={[0, 0, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          const variantId = other.rigidBodyObject?.userData?.shopifyId as string | undefined;

          if (variantId && !productsInBasket.current.has(variantId)) {
            productsInBasket.current.add(variantId);
            console.log('Product entered basket:', variantId);
            addToCart(variantId, 1).catch(console.error);
          }
        }}
        onIntersectionExit={({ other }) => {
          const variantId = other.rigidBodyObject?.userData?.shopifyId as string | undefined;

          if (variantId) {
            productsInBasket.current.delete(variantId);

            // Find the line ID for this variant
            const line = cart?.lines.edges.find(
              (edge) => edge.node.merchandise.id === variantId
            );

            if (line) {
              console.log('Product left basket:', variantId);
              removeFromCart(line.node.id).catch(console.error);
            }
          }
        }}
      />
    </RigidBody>
  );
}
```

Expected: Basket component with walls and sensor

**Step 2: Commit**

```bash
git add components/canvas/Basket.tsx
git commit -m "feat: add Basket component with physics walls and sensor"
```

---

### Task 4.2: Add Physics World to Scene

**Files:**
- Modify: `components/canvas/Scene.tsx`

**Step 1: Wrap scene with Physics and add Basket**

Update `components/canvas/Scene.tsx`:
```tsx
'use client';

import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, DragControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useCart } from '@/hooks/useCart';
import { Product } from './Product';
import { Floor } from './Floor';
import { Basket } from './Basket';

// Calculate grid positions for products
function calculateGridPositions(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const columns = 3;
  const spacing = 2;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const x = (col - (columns - 1) / 2) * spacing;
    const z = row * spacing - 4; // Moved back to make room for basket
    positions.push([x, 1, z]); // Start higher so they fall
  }

  return positions;
}

export function Scene() {
  const { products } = useCart();
  const positions = calculateGridPositions(products.length);
  const productRefs = useRef<THREE.Mesh[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 12], fov: 50 }}
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

      {/* Physics world */}
      <Physics debug={false}>
        {/* Products with physics */}
        {products.map((product, index) => (
          <Product
            key={product.id}
            product={product}
            position={positions[index] || [0, 1, 0]}
            isDragging={draggingIndex === index}
            ref={(el) => {
              if (el) productRefs.current[index] = el;
            }}
          />
        ))}

        {/* Basket with sensor */}
        <Basket />

        {/* Floor */}
        <Floor />
      </Physics>

      {/* Camera controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={8}
        maxDistance={20}
      />
    </Canvas>
  );
}
```

Expected: Physics world added with basket

**Step 2: Commit**

```bash
git add components/canvas/Scene.tsx
git commit -m "feat: add Physics world wrapper to scene"
```

---

### Task 4.3: Update Product with RigidBody

**Files:**
- Modify: `components/canvas/Product.tsx`

**Step 1: Add RigidBody to Product**

Update `components/canvas/Product.tsx`:
```tsx
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
```

Expected: Products have physics bodies

**Step 2: Commit**

```bash
git add components/canvas/Product.tsx
git commit -m "feat: add RigidBody to Product component"
```

---

### Task 4.4: Update Floor with Collider

**Files:**
- Modify: `components/canvas/Floor.tsx`

**Step 1: Add RigidBody to Floor**

Update `components/canvas/Floor.tsx`:
```tsx
'use client';

import { RigidBody } from '@react-three/rapier';

export function Floor() {
  return (
    <RigidBody type="fixed" colliders="hull">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2d2d44" />
      </mesh>
    </RigidBody>
  );
}
```

Expected: Floor has physics collider

**Step 2: Commit**

```bash
git add components/canvas/Floor.tsx
git commit -m "feat: add RigidBody to Floor component"
```

---

### Task 4.5: Test Physics and Basket

**Step 1: Test in browser**

Run:
```bash
npm run dev
```

Expected:
- Products fall when scene loads
- Products bounce off floor
- Dragging products into basket adds to cart
- Cart badge updates

**Step 2: Enable debug mode temporarily (optional)**

In `Scene.tsx`, change `<Physics debug={false}>` to `<Physics debug={true}>` to see collider outlines.

**Step 3: Commit after testing**

```bash
git add -A
git commit -m "feat: complete physics integration with basket sensor"
```

---

## Layer 4 Checkpoint

**Verify before proceeding:**
- [ ] Products fall with gravity on load
- [ ] Products bounce off floor
- [ ] Products can be dragged
- [ ] Dropping product in basket adds to cart
- [ ] Cart badge updates
- [ ] Checkout button appears

---

## Layer 5: Polish & Final Testing

### Task 5.1: Add Product Labels (Optional Enhancement)

**Files:**
- Modify: `components/canvas/Product.tsx`

**Step 1: Add text label above product**

Update `components/canvas/Product.tsx`:
```tsx
'use client';

import { forwardRef } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Text, Float } from '@react-three/drei';
import { ShopifyProduct } from '@/types/shopify';

// ... (keep getProductColor function)

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

        {/* Floating label */}
        <Float speed={2} floatIntensity={0.5}>
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {product.title.slice(0, 15)}
          </Text>
        </Float>
      </RigidBody>
    );
  }
);

export type ProductHandle = RapierRigidBody;
```

Expected: Products have floating labels

**Step 2: Commit**

```bash
git add components/canvas/Product.tsx
git commit -m "feat: add floating product labels"
```

---

### Task 5.2: Update Page Instructions

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update instructions text**

In `app/page.tsx`, update the instructions div:
```tsx
<div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-4 py-2 text-sm text-white">
  🎮 Drag products and drop them in the basket to add to cart!
</div>
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "docs: update page instructions"
```

---

### Task 5.3: Final Testing and Verification

**Step 1: Run full test**

Run:
```bash
npm run dev
```

**Step 2: Verify all MVP features:**

- [ ] Products fetch from Shopify and display
- [ ] Products render as 3D cubes with colors
- [ ] Products can be dragged with mouse
- [ ] Products fall with physics
- [ ] Dropping in basket adds to cart
- [ ] Cart badge shows item count
- [ ] Checkout button links to Shopify
- [ ] Checkout flow works end-to-end

**Step 3: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete MVP - R3F + Shopify drag-and-drop cart"
```

---

## Summary

**Completed Layers:**
1. ✅ **Shopify Foundation** — Products, cart, checkout
2. ✅ **3D Scene Setup** — Canvas, lighting, products as cubes
3. ✅ **Drag & Drop** — DragControls for product manipulation
4. ✅ **Physics** — Rapier physics, basket with sensor
5. ✅ **Polish** — Labels, UI overlay, final testing

**Files Created:**
- `types/shopify.ts`
- `lib/shopify.ts`
- `hooks/useCart.ts`
- `components/canvas/Scene.tsx`
- `components/canvas/Product.tsx`
- `components/canvas/Floor.tsx`
- `components/canvas/Basket.tsx`
- `components/ui/CartBadge.tsx`
- `components/ui/CheckoutButton.tsx`

**Next Steps (Post-MVP):**
- Replace DragControls with custom raycasting implementation
- Add product images as textures
- Add sound effects
- Mobile touch support
- Custom 3D models (GLTF)
