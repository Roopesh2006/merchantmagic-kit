import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type StorefrontData = {
  shop: {
    id: string;
    name: string;
    slug: string;
    shop_phone_number: string;
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
      .select("id, name, slug, shop_phone_number")
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

const createShopSchema = z.object({
  shopName: z.string().trim().min(1).max(100),
  shopSlug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  phone: z.string().trim().regex(/^\+[0-9]{7,15}$/, "must be +countrycode + digits"),
  password: z.string().min(6).max(100),
});

export const createShop = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createShopSchema.parse(d))
  .handler(async ({ data }) => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(data.password, 10);
    const { data: shop, error } = await supabaseAdmin
      .from("shop")
      .insert({
        name: data.shopName,
        slug: data.shopSlug,
        shop_phone_number: data.phone,
        admin_password_hash: hash,
      })
      .select("id, slug")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("That slug is taken");
      throw new Error(error.message);
    }
    return shop;
  });
