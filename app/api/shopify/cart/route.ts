import { type NextRequest, NextResponse } from "next/server";
import {
	addToCart,
	createCart,
	getCart,
	removeFromCart,
} from "@/lib/shopify-server";
import type { ShopifyCart } from "@/types/shopify";

export async function POST() {
	try {
		const cart = await createCart();
		return NextResponse.json({ cart });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to create cart",
			},
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const cartId = searchParams.get("cartId");

	if (!cartId) {
		return NextResponse.json({ error: "cartId is required" }, { status: 400 });
	}

	try {
		const cart = await getCart(cartId);
		return NextResponse.json({ cart });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to fetch cart",
			},
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	const body = await request.json();
	const { action, cartId, variantId, lineId, quantity } = body;

	try {
		let cart: ShopifyCart;
		if (action === "add" && cartId && variantId) {
			cart = await addToCart(cartId, variantId, quantity ?? 1);
		} else if (action === "remove" && cartId && lineId) {
			cart = await removeFromCart(cartId, lineId);
		} else {
			return NextResponse.json({ error: "Invalid action" }, { status: 400 });
		}
		return NextResponse.json({ cart });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Cart operation failed",
			},
			{ status: 500 },
		);
	}
}
