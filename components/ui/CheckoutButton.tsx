"use client";

import { useCart } from "@/hooks/useCart";

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
