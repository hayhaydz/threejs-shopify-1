# Secure Shopify API Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the secure API architecture by removing client-side Shopify calls and ensuring all credentials stay server-side.

**Architecture:** All Shopify API calls go through Next.js API routes (`/api/shopify/*`). The `useCart` hook calls these routes via fetch. Server-side code uses `server-only` package to prevent accidental client-side imports. Old client-side `lib/shopify.ts` is deleted.

**Tech Stack:** Next.js API Routes, server-only package, Shopify Storefront API 2026-01

---

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| `app/api/shopify/products/route.ts` | ✅ Created | Calls `lib/shopify-server.ts` |
| `app/api/shopify/cart/route.ts` | ✅ Created | Handles create/get/add/remove |
| `lib/shopify-server.ts` | ✅ Created | Has `server-only` directive |
| `hooks/useCart.tsx` | ✅ Updated | Calls API routes via fetch |
| `lib/shopify.ts` | ❌ Obsolete | Must be deleted |

---

## Task 1: Install server-only Package

**Files:**
- Modify: `package.json`

**Step 1: Install server-only**

Run:
```bash
npm install server-only
```

Expected: Package added to dependencies

**Step 2: Verify installation**

Run:
```bash
npm ls server-only
```

Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add server-only package for API route protection"
```

---

## Task 2: Delete Obsolete Client-Side Shopify Module

**Files:**
- Delete: `lib/shopify.ts`

**Step 1: Delete the old file**

Run:
```bash
rm lib/shopify.ts
```

Expected: File removed

**Step 2: Verify no imports reference it**

Run:
```bash
grep -r "from.*lib/shopify\"" --include="*.ts" --include="*.tsx" .
```

Expected: No matches (all should use `lib/shopify-server` or API routes)

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove obsolete client-side Shopify module"
```

---

## Task 3: Update .env.example Documentation

**Files:**
- Modify: `.env.example`

**Step 1: Update .env.example with clear comments**

Replace `.env.example`:
```env
# Shopify Storefront API Configuration
# These credentials are used server-side only via API routes

# Your Shopify store domain (e.g., your-store.myshopify.com)
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

# Storefront Access Token (PUBLIC - safe for client-side)
# Get this from Shopify Admin > Settings > Apps and sales channels > Develop apps > Your app > API credentials
# IMPORTANT: Use the Storefront API access token, NOT the Admin API access token
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_public_storefront_token_here
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: clarify .env.example with security notes"
```

---

## Task 4: Verify TypeScript Compilation

**Files:**
- None (verification only)

**Step 1: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 2: Run lint**

Run:
```bash
npm run lint
```

Expected: No errors

**Step 3: Run build**

Run:
```bash
npm run build
```

Expected: Build succeeds

---

## Task 5: Test API Routes Locally

**Files:**
- None (testing only)

**Step 1: Start dev server**

Run:
```bash
npm run dev
```

**Step 2: Test products endpoint**

In another terminal:
```bash
curl http://localhost:3000/api/shopify/products
```

Expected: JSON response with products array (or error if credentials not set)

**Step 3: Test cart creation**

```bash
curl -X POST http://localhost:3000/api/shopify/cart
```

Expected: JSON response with cart object (or error if credentials not set)

---

## Task 6: Final Commit and Push

**Files:**
- None (finalization)

**Step 1: Check git status**

Run:
```bash
git status
```

Expected: Working tree clean (or only uncommitted intentional changes)

**Step 2: Push to remote**

Run:
```bash
git push origin main
```

Expected: All commits pushed

---

## Summary

**Architecture After Completion:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  useCart hook                                                    │
│     │                                                            │
│     └──► fetch("/api/shopify/products")                         │
│     └──► fetch("/api/shopify/cart", {...})                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Server (Next.js)                           │
├─────────────────────────────────────────────────────────────────┤
│  API Routes (app/api/shopify/*)                                 │
│     │                                                            │
│     └──► lib/shopify-server.ts (server-only)                    │
│              │                                                   │
│              └──► process.env.SHOPIFY_* (server-only)           │
│              └──► Shopify Storefront API                        │
└─────────────────────────────────────────────────────────────────┘
```

**Security Guarantees:**
- ✅ Shopify credentials never sent to client
- ✅ `server-only` package prevents accidental client imports
- ✅ Old client-side module deleted
- ✅ All API calls go through server routes

**Files Changed:**
- Deleted: `lib/shopify.ts`
- Modified: `package.json` (added server-only)
- Modified: `.env.example` (clarified documentation)
