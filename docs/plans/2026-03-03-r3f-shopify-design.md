# Design: R3F + Shopify Drag-and-Drop Cart

**Created:** 2026-03-03
**Status:** Approved
**Type:** MVP Learning Project

---

## Executive Summary

A physics-based drag-and-drop shopping cart using React Three Fiber and Shopify Storefront API. Users drag 3D product objects into a virtual basket, with physics providing satisfying drop interactions. Cart state syncs with Shopify in real-time, culminating in a real checkout flow.

---

## Goals

### Primary Goals (In Priority Order)
1. **Shopify Integration** — Connect real e-commerce data to a creative frontend
2. **Physics Interactions** — Satisfying "drop into basket" feel with collisions and bouncing
3. **Drag & Drop Mechanics** — Translate 2D mouse input into 3D object manipulation

### Learning Outcomes
- Understand React Three Fiber fundamentals (Canvas, meshes, lighting)
- Learn Rapier physics (rigid bodies, colliders, sensors)
- Master 2D → 3D coordinate transformation (raycasting)
- Integrate Shopify Storefront API with GraphQL

---

## Architecture

### System Overview

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
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Shopify API → Products → React State → 3D Meshes
                                    ↓
                            User Drags Product
                                    ↓
                            Physics Collision
                                    ↓
                            Shopify Cart Mutation
                                    ↓
                            UI Update (count, checkout)
```

### Component Separation

| Layer | Concern | Location |
|-------|---------|----------|
| 3D Rendering | Canvas, meshes, lighting | `components/canvas/` |
| Physics | Rapier bodies, sensors | Within canvas components |
| UI Overlay | Cart badge, checkout | `components/ui/` |
| Data | Shopify API, cart state | `lib/`, `hooks/` |

---

## Tech Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 14 (App Router) | Server components for API, familiar DX |
| Styling | Tailwind CSS | Quick UI overlays |
| 3D Engine | Three.js + @react-three/fiber | Declarative 3D in React |
| 3D Helpers | @react-three/drei | Cameras, controls, shapes |
| Physics | @react-three/rapier | Modern, React-friendly |
| E-commerce | Shopify Storefront API | Real cart, hosted checkout |

---

## Project Structure

```
threejs-shopify/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── canvas/
│   │   ├── Scene.tsx
│   │   ├── Product.tsx
│   │   ├── Basket.tsx
│   │   └── Floor.tsx
│   └── ui/
│       ├── CartBadge.tsx
│       └── CheckoutButton.tsx
├── lib/
│   └── shopify.ts
├── hooks/
│   └── useCart.ts
├── types/
│   └── shopify.ts
├── .env.local
└── package.json
```

---

## Implementation Layers

### Layer 1: Shopify Foundation

**Goal:** Real product data and working cart before any 3D code.

**Deliverables:**
- Environment configuration (`.env.local`)
- Shopify GraphQL client (`lib/shopify.ts`)
- Cart state hook (`hooks/useCart.ts`)
- TypeScript types (`types/shopify.ts`)

**API Operations:**
- `getProducts()` — Fetch 5-10 products
- `createCart()` — Initialize cart session
- `addToCart(cartId, variantId, quantity)` — Add item
- `removeFromCart(cartId, lineId)` — Remove item
- `getCart(cartId)` — Fetch cart state with checkout URL

**Success Criteria:**
- Products display in console or simple DOM
- Cart can be created and items added via button clicks
- Checkout URL redirects to Shopify

---

### Layer 2: 3D Scene Setup

**Goal:** Render products as 3D objects with basic lighting.

**Deliverables:**
- Canvas wrapper (`components/canvas/Scene.tsx`)
- Product mesh (`components/canvas/Product.tsx`)
- Floor plane (`components/canvas/Floor.tsx`)
- Lighting setup (ambient + directional)

**R3F Concepts Introduced:**
- `<Canvas>` — 3D world container
- `<mesh>` — Object in scene
- `<boxGeometry>` — Shape
- `<meshStandardMaterial>` — Appearance
- Lights — Illumination

**Success Criteria:**
- Products render as colored cubes
- Scene is well-lit and visible
- Camera position shows all products

---

### Layer 3: Drag & Drop Interactions

**Goal:** Make products draggable with mouse.

**Phase 3a: DragControls (Quick Win)**
- Use `@react-three/drei` DragControls
- Products become draggable
- Disable physics during drag

**Phase 3b: Custom Implementation (Learning)**
- Replace DragControls with custom hook
- Learn raycasting fundamentals
- Understand 2D → 3D coordinate mapping

**Success Criteria:**
- Products follow mouse cursor while dragging
- Smooth movement on horizontal plane
- Physics re-engages on release

---

### Layer 4: Physics with Rapier

**Goal:** Add gravity, collisions, and basket detection.

**Deliverables:**
- Physics world wrapper
- Product rigid bodies (dynamic)
- Basket with walls (static) + sensor (trigger)
- Floor collider (static)

**Basket Architecture:**
```
┌─────────────┐
│   walls     │  ← Static colliders
└─────────────┘
  ┌─────────┐
  │ SENSOR  │  ← Triggers cart add/remove
  └─────────┘
```

**Physics Events:**
- `onIntersectionEnter` → Add to Shopify cart
- `onIntersectionExit` → Remove from Shopify cart

**Success Criteria:**
- Products fall with gravity
- Products bounce off floor and basket walls
- Dropping in basket triggers cart add
- Dragging out triggers cart remove

---

### Layer 5: Polish & Checkout

**Goal:** Complete e-commerce flow with UI overlay.

**Deliverables:**
- Cart badge with item count
- Checkout button linking to Shopify
- Visual feedback on cart changes

**Success Criteria:**
- Cart count updates in real-time
- Checkout redirects to Shopify hosted page
- Full purchase flow works end-to-end

---

## MVP Scope

### In Scope
- ✅ Fetch 5-10 products from Shopify
- ✅ Render as 3D cubes with colors
- ✅ Drag with DragControls
- ✅ Physics drop into basket
- ✅ Add/remove from cart via sensors
- ✅ Cart count display
- ✅ Checkout link

### Out of Scope (Post-MVP)
- ❌ Custom 3D models (GLTF)
- ❌ Product images as textures
- ❌ Multiple variants per product
- ❌ Sound effects
- ❌ Mobile touch support
- ❌ Custom drag (Phase 3b is post-MVP)

---

## Security Considerations

- Storefront token is **public-safe** (read-only product data, cart operations)
- **Never commit** `.env.local` to git
- Private token (`shpat_`) stays in `_refile.txt` — not needed for this MVP

---

## Next Steps

1. ✅ Design approved
2. ⏳ Create implementation plan
3. ⏳ Initialize Next.js project
4. ⏳ Begin Layer 1 implementation
