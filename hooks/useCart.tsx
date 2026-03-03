"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { ShopifyCart, ShopifyProduct } from "@/types/shopify";

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

const CART_ID_KEY = "shopify_cart_id";

// API client functions - calls our server routes
async function fetchProducts(): Promise<ShopifyProduct[]> {
	const response = await fetch("/api/shopify/products");
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to fetch products");
	}
	const data = await response.json();
	return data.products;
}

async function fetchCreateCart(): Promise<ShopifyCart> {
	const response = await fetch("/api/shopify/cart", { method: "POST" });
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to create cart");
	}
	const data = await response.json();
	return data.cart;
}

async function fetchGetCart(cartId: string): Promise<ShopifyCart | null> {
	const response = await fetch(
		`/api/shopify/cart?cartId=${encodeURIComponent(cartId)}`,
	);
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to fetch cart");
	}
	const data = await response.json();
	return data.cart;
}

async function fetchAddToCart(
	cartId: string,
	variantId: string,
	quantity: number,
): Promise<ShopifyCart> {
	const response = await fetch("/api/shopify/cart", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			action: "add",
			cartId,
			variantId,
			quantity,
		}),
	});
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to add to cart");
	}
	const data = await response.json();
	return data.cart;
}

async function fetchRemoveFromCart(
	cartId: string,
	lineId: string,
): Promise<ShopifyCart> {
	const response = await fetch("/api/shopify/cart", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			action: "remove",
			cartId,
			lineId,
		}),
	});
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to remove from cart");
	}
	const data = await response.json();
	return data.cart;
}

export function CartProvider({ children }: { children: ReactNode }) {
	const [products, setProducts] = useState<ShopifyProduct[]>([]);
	const [cart, setCart] = useState<ShopifyCart | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Initialize - fetch products and restore/create cart
	useEffect(() => {
		let isMounted = true;

		async function initialize() {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch products
				const fetchedProducts = await fetchProducts();
				if (!isMounted) return;
				setProducts(fetchedProducts);

				// Check localStorage for saved cart ID
				const savedCartId = localStorage.getItem(CART_ID_KEY);

				if (savedCartId) {
					// Try to restore existing cart
					const existingCart = await fetchGetCart(savedCartId);
					if (!isMounted) return;

					if (existingCart) {
						setCart(existingCart);
					} else {
						// Cart no longer exists, create new one
						const newCart = await fetchCreateCart();
						if (!isMounted) return;
						setCart(newCart);
						localStorage.setItem(CART_ID_KEY, newCart.id);
					}
				} else {
					// No saved cart, create new one
					const newCart = await fetchCreateCart();
					if (!isMounted) return;
					setCart(newCart);
					localStorage.setItem(CART_ID_KEY, newCart.id);
				}
			} catch (err) {
				if (!isMounted) return;
				const errorMessage =
					err instanceof Error ? err.message : "Failed to initialize cart";
				setError(errorMessage);
				console.error("Cart initialization error:", err);
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		initialize();

		return () => {
			isMounted = false;
		};
	}, []);

	// Add to cart callback
	const addToCart = useCallback(
		async (variantId: string, quantity: number = 1) => {
			if (!cart) {
				setError("Cart not initialized");
				return;
			}

			try {
				setError(null);
				const updatedCart = await fetchAddToCart(cart.id, variantId, quantity);
				setCart(updatedCart);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to add item to cart";
				setError(errorMessage);
				console.error("Add to cart error:", err);
			}
		},
		[cart],
	);

	// Remove from cart callback
	const removeFromCart = useCallback(
		async (lineId: string) => {
			if (!cart) {
				setError("Cart not initialized");
				return;
			}

			try {
				setError(null);
				const updatedCart = await fetchRemoveFromCart(cart.id, lineId);
				setCart(updatedCart);
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to remove item from cart";
				setError(errorMessage);
				console.error("Remove from cart error:", err);
			}
		},
		[cart],
	);

	// Calculate item count from cart lines
	const itemCount =
		cart?.lines.edges.reduce(
			(total: number, edge) => total + edge.node.quantity,
			0,
		) ?? 0;

	// Checkout URL from cart
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
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
}
