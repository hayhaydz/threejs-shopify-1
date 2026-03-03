import { NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify-server";

export async function GET() {
	try {
		const products = await getProducts();
		return NextResponse.json({ products });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to fetch products" },
			{ status: 500 },
		);
	}
}
