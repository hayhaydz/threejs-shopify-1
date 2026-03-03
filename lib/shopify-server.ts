import "server-only";

import type {
	AddToCartResponse,
	CartResponse,
	CreateCartResponse,
	ProductsResponse,
	RemoveFromCartResponse,
	ShopifyCart,
	ShopifyProduct,
} from "@/types/shopify";

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

function getShopifyConfig() {
	if (!STORE_DOMAIN || !STOREFRONT_ACCESS_TOKEN) {
		throw new Error(
			"Missing Shopify credentials. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local",
		);
	}

	return {
		storeDomain: STORE_DOMAIN,
		storefrontAccessToken: STOREFRONT_ACCESS_TOKEN,
		graphqlUrl: `https://${STORE_DOMAIN}/api/2026-01/graphql.json`,
	};
}

async function shopifyFetch<T>(
	query: string,
	variables: Record<string, unknown> = {},
): Promise<T> {
	const { graphqlUrl, storefrontAccessToken } = getShopifyConfig();

	const response = await fetch(graphqlUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Shopify-Storefront-Access-Token": storefrontAccessToken,
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
          images(first: 5) {
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
          variants(first: 10) {
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
export async function getProducts(
	first: number = 10,
): Promise<ShopifyProduct[]> {
	const data = await shopifyFetch<ProductsResponse>(GET_PRODUCTS_QUERY, {
		first,
	});
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
	quantity: number = 1,
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
	lineId: string,
): Promise<ShopifyCart> {
	const data = await shopifyFetch<RemoveFromCartResponse>(
		REMOVE_FROM_CART_MUTATION,
		{
			cartId,
			lineIds: [lineId],
		},
	);

	if (data.cartLinesRemove.userErrors.length > 0) {
		throw new Error(data.cartLinesRemove.userErrors[0].message);
	}

	return data.cartLinesRemove.cart;
}
