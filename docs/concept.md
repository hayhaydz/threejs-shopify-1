# Project Plan: R3F + Shopify Drag-and-Drop Cart MVP

This sounds like an incredibly fun and satisfying experiment! Physics-based UI interactions are always a blast to build, and tying them directly to a real e-commerce cart is a great way to push the boundaries of standard web dev. 

Since the goal is a rough MVP, we are going to keep the architecture flat, use basic 3D shapes instead of complex models, and rely on standard libraries so you do not have to reinvent the wheel. 

Here is a lean, step-by-step project plan to get this prototype off the ground without overengineering it.

---

## Tech Stack for the MVP
* **Framework:** Next.js (App Router, minimal setup)
* **3D Engine:** three, @react-three/fiber
* **3D Helpers:** @react-three/drei (for cameras, lighting, and drag controls)
* **3D Physics:** @react-three/rapier (essential for that satisfying "drop into the basket" feel)
* **E-commerce:** Shopify Storefront API (GraphQL)

---

## Phase 1: The Foundation (Next.js + Shopify)
**Goal:** Get the app running and talking to your Shopify store.

* **Initialize Next.js:** Run npx create-next-app@latest (keep it simple, use Tailwind for quick UI overlays).
* **Shopify Setup:**
  * Create a custom app in your Shopify admin.
  * Enable the Storefront API and grab your public access token.
  * Create 2 to 3 dummy products in your Shopify store.
* **API Utility Functions:** Write basic GraphQL fetch functions to:
  * Fetch products.
  * Create a cart.
  * Add a line item to the cart.
  * Remove a line item from the cart.

## Phase 2: The 3D Scene Setup
**Goal:** Render a basic 3D environment with physics.

* **Install R3F dependencies:** npm install three @react-three/fiber @react-three/drei @react-three/rapier
* **Create the Canvas:** Set up a full-screen R3F Canvas component in your main Next.js page.
* **Add Lighting & Camera:** Throw in an ambient light, a directional light, and a basic PerspectiveCamera or OrbitControls (locked so the user does not accidentally spin the whole world while trying to drag).
* **Setup Physics World:** Wrap the scene contents in a Physics component from Rapier. Add a static plane to act as the floor or table.

## Phase 3: The Interactive Objects
**Goal:** Create draggable 3D items and a receptacle (the basket).

* **The Products (Draggable):**
  * Fetch the Shopify products on load.
  * Map through them to render 3D meshes (e.g., colored Box or Sphere components from Drei to represent the products).
  * Wrap each mesh in a Rapier RigidBody.
  * Implement dragging. MVP Tip: Use Drei's DragControls or temporarily disable physics gravity on the object while the mouse is clicked/dragging, then re-enable gravity on release.
* **The Basket (Receptacle):**
  * Build a rudimentary basket using 5 static physics planes (a bottom and 4 walls) so objects do not fall out.
  * Attach a Sensor Collider (a trigger zone in Rapier) inside the basket area to detect when a product's RigidBody enters it.

## Phase 4: Tying 3D to Shopify (The Magic)
**Goal:** Sync the physics events with your Shopify cart.

* **Collision Detection (Add to Cart):**
  * Listen for the onIntersectionEnter event on the basket's sensor collider.
  * When a product object drops in, grab its Shopify Variant ID.
  * Trigger your addToCart GraphQL mutation.
  * MVP Tip: Debounce this or add a flag so it does not fire 50 times while the object is bouncing around in the basket.
* **Collision Exit (Remove from Cart):**
  * Listen for the onIntersectionExit event on the basket's sensor.
  * If the user drags the item out of the basket, trigger the removeFromCart mutation.

## Phase 5: UI & Polish
**Goal:** Make it usable as a web store prototype.

* **HTML Overlay:** Create a standard DOM UI overlaid on top of the Canvas using absolute positioning.
* **Cart Status:** Display a simple text counter in the corner: "Cart Items: X".
* **Checkout Button:** Add a button that links to the checkoutUrl returned by the Shopify Storefront API when a cart is created.

---

## Potential MVP Pitfalls to Avoid
> * **Do not import custom 3D models yet.** Rely on simple cubes or spheres with different colors to represent different products first. Getting the drag-and-drop physics and Shopify API right is the hard part.
> * **Do not overcomplicate dragging.** True physics-based dragging (using joints) is hard. For the MVP, just explicitly set the X/Y position of the object to match the mouse coordinates while holding click, and let Rapier's gravity take over when you let go.

---

Would you like me to draft the starter code for Phase 3 so you have a working boilerplate for the React Three Fiber drag-and-drop physics?