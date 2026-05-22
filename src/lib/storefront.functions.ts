import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type StorefrontData = {
  shop: {
    id: string;
    name: string;
    slug: string;
    shop_phone_number: string;
    banner_url_1: string;
    banner_url_2: string | null;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    rate: number;
    original_price: number | null;
    banner_url_1: string;
    banner_url_2: string | null;
  };
  offer: {
    id: string;
    discount_price: number;
    expires_at: string;
  } | null;
};

export const getStorefront = createServerFn({ method: "GET" })
  .inputValidator((d: { shopSlug: string; productSlug: string }) => d)
  .handler(async ({ data }): Promise<StorefrontData | null> => {
    const { shopSlug, productSlug } = data;
    const { data: shop, error: shopErr } = await supabaseAdmin
      .from("shop")
      .select("id, name, slug, shop_phone_number, banner_url_1, banner_url_2")
      .eq("slug", shopSlug)
      .maybeSingle();
    if (shopErr || !shop) return null;

    const { data: product, error: prodErr } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, slug, description, rate, original_price, banner_url_1, banner_url_2",
      )
      .eq("shop_id", shop.id)
      .eq("slug", productSlug)
      .maybeSingle();
    if (prodErr || !product) return null;

    const { data: offer } = await supabaseAdmin
      .from("offers")
      .select("id, discount_price, expires_at")
      .eq("product_id", product.id)
      .maybeSingle();

    return {
      shop,
      product: {
        ...product,
        rate: Number(product.rate),
        original_price:
          product.original_price !== null ? Number(product.original_price) : null,
      },
      offer: offer
        ? { ...offer, discount_price: Number(offer.discount_price) }
        : null,
    };
  });

export type MarketplaceProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  rate: number;
  original_price: number | null;
  banner_url_1: string;
  category: string | null;
  shop_slug: string;
  shop_name: string;
  offer: { discount_price: number; expires_at: string } | null;
};

export type ShopPageData = {
  shop: {
    id: string;
    name: string;
    slug: string;
    shop_phone_number: string;
    banner_url_1: string;
    banner_url_2: string | null;
  };
  products: ShopPageProduct[];
};

export type ShopPageProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  rate: number;
  original_price: number | null;
  banner_url_1: string;
  category: string | null;
  offer: { discount_price: number; expires_at: string } | null;
};

export const getShopPage = createServerFn({ method: "GET" })
  .inputValidator((d: { shopSlug: string }) => d)
  .handler(async ({ data }): Promise<ShopPageData | null> => {
    const { shopSlug } = data;
    const { data: shop, error: shopErr } = await supabaseAdmin
      .from("shop")
      .select("id, name, slug, shop_phone_number, banner_url_1, banner_url_2")
      .eq("slug", shopSlug)
      .maybeSingle();
    if (shopErr || !shop) return null;

    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, description, rate, original_price, banner_url_1, category")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });
    if (prodErr || !products) return { shop, products: [] };

    const ids = products.map((p) => p.id);
    let offersMap: Record<string, { discount_price: number; expires_at: string }> = {};
    if (ids.length) {
      const { data: offers } = await supabaseAdmin
        .from("offers")
        .select("product_id, discount_price, expires_at")
        .in("product_id", ids);
      offersMap = Object.fromEntries(
        (offers ?? []).map((o) => [
          o.product_id,
          {
            discount_price: Number(o.discount_price),
            expires_at: o.expires_at,
          },
        ]),
      );
    }

    return {
      shop,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        rate: Number(p.rate),
        original_price: p.original_price !== null ? Number(p.original_price) : null,
        banner_url_1: p.banner_url_1,
        category: p.category,
        offer: offersMap[p.id] ?? null,
      })),
    };
  });

export const getMarketplace = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketplaceProduct[]> => {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, slug, description, rate, original_price, banner_url_1, category, shop:shop_id(slug, name)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error || !products) return [];

    const ids = products.map((p) => p.id);
    let offersMap: Record<string, { discount_price: number; expires_at: string }> = {};
    if (ids.length) {
      const { data: offers } = await supabaseAdmin
        .from("offers")
        .select("product_id, discount_price, expires_at")
        .in("product_id", ids);
      offersMap = Object.fromEntries(
        (offers ?? []).map((o) => [
          o.product_id,
          {
            discount_price: Number(o.discount_price),
            expires_at: o.expires_at,
          },
        ]),
      );
    }

    return products
      .filter((p) => p.shop)
      .map((p) => {
        const shop = p.shop as unknown as { slug: string; name: string };
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          rate: Number(p.rate),
          original_price:
            p.original_price !== null ? Number(p.original_price) : null,
          banner_url_1: p.banner_url_1,
          category: p.category,
          shop_slug: shop.slug,
          shop_name: shop.name,
          offer: offersMap[p.id] ?? null,
        };
      });
  },
);
