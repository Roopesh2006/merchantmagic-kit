// Hardcoded fallback for /nike-store/air-jordan — used if DB query fails.
export const NIKE_FALLBACK = {
  shop: {
    id: "fallback-nike",
    name: "Nike Official Store",
    slug: "nike-store",
    shop_phone_number: "+12025550143",
    banner_url_1: "",
    banner_url_2: null,
  },
  product: {
    id: "fallback-aj",
    shop_id: "fallback-nike",
    name: "Air Jordan 1 Retro High OG",
    slug: "air-jordan",
    description:
      "The Air Jordan 1 Retro High OG remasters the classic with premium materials and bold colorblocking. Full-grain leather upper. Encapsulated Air-Sole unit. Iconic Wings logo. Built for the court, designed for the streets.",
    rate: 220,
    original_price: 290,
    banner_url_1:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80",
    banner_url_2:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1600&q=80",
  },
  offer: {
    id: "fallback-offer",
    product_id: "fallback-aj",
    discount_price: 169,
    // 48h from page load
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },
};
