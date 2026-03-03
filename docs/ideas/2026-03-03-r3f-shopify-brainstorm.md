# R3F + Shopify Drag-and-Drop Cart — Brainstorming Session

**Date:** 2026-03-03
**Status:** Approved, ready for implementation planning

---

## Project Goals

| Aspect | Decision |
|--------|----------|
| **Motivation** | Learning experiment — explore R3F physics, 3D web, and Shopify API |
| **Products** | 5-10 products for visual variety |
| **Experience** | Comfortable with React/Next.js, new to 3D/R3F |
| **Priorities** | 1. Shopify integration, 2. Physics interactions, 3. Drag-and-drop mechanics |
| **Approach** | Guided step-by-step with explanations |

---

## Chosen Approach: Layered Foundation

Build in layers, each adding a new concept before moving on:

1. **Shopify Layer** — Set up Next.js + fetch products from Shopify API first
2. **3D Layer** — Render products as 3D objects (simple shapes, basic lighting)
3. **Interaction Layer** — Add drag controls (DragControls first, custom later for learning)
4. **Physics Layer** — Add Rapier physics for satisfying drop behavior
5. **Polish Layer** — Basket sensor, cart sync, checkout flow

### Why This Approach
- Shopify success early (motivating!)
- Each layer builds on the last
- Easier to debug — isolated layers
- Perfect for step-by-step learning

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Page      │  │   Canvas    │  │   UI Overlay        │  │
│  │  (layout)   │──│   (3D)      │──│   (cart, checkout)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         ▼                ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Shopify Storefront API                     ││
│  │   (products, cart, checkout)                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key Insight:** The 3D canvas and React UI are siblings — they share state through React context, not through 3D scene internals.

**Data Flow:**
1. Products fetched from Shopify → stored in React state
2. React state → renders 3D product meshes in Canvas
3. User drags product → physics detects basket collision
4. Collision event → triggers Shopify cart mutation
5. Cart state → updates UI overlay (item count, checkout button)

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 14 (App Router) | File-based routing, server components for API calls |
| **Styling** | Tailwind CSS | Quick UI overlays, already familiar |
| **3D Engine** | Three.js + @react-three/fiber | Declarative 3D in React |
| **3D Helpers** | @react-three/drei | Pre-built cameras, controls, shapes |
| **Physics** | @react-three/rapier | Modern physics engine, great React integration |
| **E-commerce** | Shopify Storefront API (GraphQL) | Real cart, real checkout |

---

## Project Structure

```
threejs-shopify/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main 3D scene + UI overlay
│   └── globals.css         # Tailwind imports
├── components/
│   ├── canvas/
│   │   ├── Scene.tsx       # Main R3F canvas wrapper
│   │   ├── Product.tsx     # Draggable 3D product mesh
│   │   ├── Basket.tsx      # Physics basket with sensor
│   │   └── Floor.tsx       # Ground plane
│   └── ui/
│       ├── CartBadge.tsx   # Item count display
│       └── CheckoutButton.tsx
├── lib/
│   └── shopify.ts          # GraphQL queries & mutations
├── hooks/
│   └── useCart.ts          # Cart state management
├── types/
│   └── shopify.ts          # TypeScript types for API
└── .env.local              # Shopify credentials (never commit!)
```

---

## Layer Details

### Layer 1: Shopify Foundation

**Environment Variables:**
```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=<from _refile.txt>
```

**API Operations:**

| Operation | Type | Purpose |
|-----------|------|---------|
| `getProducts` | Query | Fetch 5-10 products with images, variants, prices |
| `createCart` | Mutation | Create a new cart session |
| `addToCart` | Mutation | Add product variant to cart |
| `removeFromCart` | Mutation | Remove item from cart |
| `getCart` | Query | Fetch current cart state (items, total, checkout URL) |

**useCart Hook:**
```typescript
const { cart, addToCart, removeFromCart, checkoutUrl } = useCart()
```

---

### Layer 2: 3D Scene Setup

**3D Basics:**

| Concept | What It Is | R3F Component |
|---------|------------|---------------|
| **Scene** | The 3D world container | `<Canvas>` |
| **Camera** | Your viewpoint into the scene | `<PerspectiveCamera>` or `<OrbitControls>` |
| **Mesh** | An object with geometry + material | `<mesh>` |
| **Geometry** | The shape (cube, sphere, etc.) | `<boxGeometry>` |
| **Material** | How it looks (color, texture) | `<meshStandardMaterial>` |
| **Light** | Illuminates the scene | `<ambientLight>`, `<directionalLight>` |

**Scene Structure:**
```jsx
<Canvas>
  <ambientLight intensity={0.5} />
  <directionalLight position={[10, 10, 5]} intensity={1} />
  <OrbitControls enableZoom={false} enablePan={false} />
  {products.map(product => <Product key={product.id} product={product} />)}
  <Basket />
  <Floor />
</Canvas>
```

---

### Layer 3: Drag & Drop Interactions

**Two-Phase Approach:**

| Phase | Approach | Goal |
|-------|----------|------|
| **Phase 3a** | Use Drei's `DragControls` | Get dragging working fast |
| **Phase 3b** | Replace with custom raycasting | Learn how it actually works |

**DragControls Usage:**
```jsx
<DragControls
  items={productMeshRefs}
  onDragStart={() => disablePhysics()}
  onDragEnd={(object) => enablePhysics(object)}
>
  {products.map(product => <Product key={product.id} product={product} />)}
</DragControls>
```

---

### Layer 4: Physics with Rapier

**Physics Concepts:**

| Concept | What It Does |
|---------|--------------|
| **RigidBody** | An object that physics affects (falls, bounces, collides) |
| **Collider** | The shape used for collision detection |
| **Sensor** | A collider that detects overlaps but doesn't block movement |
| **Static body** | Doesn't move (floor, walls) but other things bounce off it |

**Basket Strategy:**
1. **Outer walls** — Static colliders that keep products inside
2. **Inner sensor** — Triggers `onIntersectionEnter` when a product drops in

**Sensor Integration:**
```jsx
<cuboidCollider
  args={[1.5, 0.5, 1.5]}
  position={[0, 0.5, 0]}
  sensor
  onIntersectionEnter={({ other }) => {
    const variantId = other.rigidBodyObject?.userData?.shopifyId
    if (variantId && !productsInBasket.current.has(variantId)) {
      productsInBasket.current.add(variantId)
      addToCart(variantId, 1)
    }
  }}
  onIntersectionExit={({ other }) => {
    // Remove from cart
  }}
/>
```

---

### Layer 5: Polish & Checkout

**UI Overlay Layout:**
```
┌─────────────────────────────────────────────────┐
│  Cart: 3 items                 [Checkout →]    │  ← Fixed overlay
│                                                 │
│              [3D Canvas Here]                   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Products:                               │   │
│  │ • Product A - $25                       │   │
│  │ • Product B - $40                       │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Checkout:** Shopify handles the entire checkout page — payment, shipping, confirmation. Just redirect to their hosted checkout URL.

---

## MVP Scope

| Feature | Status |
|---------|--------|
| Fetch products from Shopify | ✅ |
| Render products as 3D cubes | ✅ |
| Drag products around | ✅ (DragControls) |
| Drop into basket with physics | ✅ |
| Add to cart on drop | ✅ |
| Remove from cart on drag out | ✅ |
| Display cart count | ✅ |
| Link to Shopify checkout | ✅ |

---

## Stretch Goals (Post-MVP)

- Custom 3D product models (GLTF)
- Product images as textures on cubes
- Multiple product colors/variants
- Sound effects
- Mobile touch support
- Custom drag implementation (for learning)

---

## Next Steps

1. ✅ Brainstorming complete
2. ⏳ Create detailed implementation plan (writing-plans skill)
3. ⏳ Begin Layer 1: Shopify Foundation
