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
