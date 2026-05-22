import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function getSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Server misconfigured");
  return s;
}

function signSession(shopId: string): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${shopId}.${expiry}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifySession(token: string): string {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid session");
  const [shopId, expiryStr, sig] = parts;
  const expiry = Number(expiryStr);
  if (!expiry || expiry < Date.now()) throw new Error("Session expired");
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(`${shopId}.${expiry}`)
    .digest("hex");
  // timing-safe compare
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid session");
  }
  return shopId;
}

async function assertSession(token: string, shopSlug: string): Promise<string> {
  const shopId = verifySession(token);
  const { data, error } = await supabaseAdmin
    .from("shop")
    .select("id")
    .eq("id", shopId)
    .eq("slug", shopSlug)
    .maybeSingle();
  if (error || !data) throw new Error("Unauthorized");
  return shopId;
}

// ---- Create Shop (Platform Admin) ----
export const adminCreateShop = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        masterKey: z.string().min(1),
        name: z.string().trim().min(1).max(100),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(80)
          .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
        shop_phone_number: z
          .string()
          .trim()
          .regex(/^\+[0-9]{7,15}$/, "must include country code, e.g. +14155551234"),
        password: z.string().min(6).max(128),
        banner_url_1: z.string().trim().max(1000).default(""),
        banner_url_2: z.string().trim().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const masterKey = process.env.VITE_ADMIN_MASTER_KEY || process.env.ADMIN_MASTER_KEY || "admin123";
    if (data.masterKey !== masterKey) {
      throw new Error("Invalid master key");
    }
    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    const { error } = await supabaseAdmin.from("shop").insert({
      name: data.name,
      slug: data.slug,
      shop_phone_number: data.shop_phone_number,
      admin_password_hash: hash,
      banner_url_1: data.banner_url_1,
      banner_url_2: data.banner_url_2 || null,
    });
    if (error) {
      if (error.code === "23505") throw new Error("That shop slug is already taken");
      throw new Error(error.message);
    }
    return { ok: true };
  });

// ---- Change Password ----
export const adminChangePassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string(),
        shopSlug: z.string(),
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6).max(128),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const shopId = await assertSession(data.token, data.shopSlug);
    const bcrypt = await import("bcryptjs");

    // Verify current password
    const { data: shop } = await supabaseAdmin
      .from("shop")
      .select("admin_password_hash")
      .eq("id", shopId)
      .single();
    if (!shop) throw new Error("Shop not found");

    const ok = await bcrypt.compare(data.currentPassword, shop.admin_password_hash);
    if (!ok) throw new Error("Current password is incorrect");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.newPassword, salt);

    const { error } = await supabaseAdmin
      .from("shop")
      .update({ admin_password_hash: hash })
      .eq("id", shopId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

// ---- Login ----
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ shopSlug: z.string().min(1), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const bcrypt = await import("bcryptjs");
    // Use service role to read admin_password_hash
    const { data: shop } = await supabaseAdmin
      .from("shop")
      .select("id, name, admin_password_hash")
      .eq("slug", data.shopSlug)
      .maybeSingle();
    if (!shop) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(data.password, shop.admin_password_hash);
    if (!ok) throw new Error("Invalid credentials");
    return { token: signSession(shop.id), shopName: shop.name };
  });

// ---- Shop read & update ----
export const adminGetShop = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string(), shopSlug: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const shopId = await assertSession(data.token, data.shopSlug);
    const { data: shop, error } = await supabaseAdmin
      .from("shop")
      .select("id, name, slug, shop_phone_number, banner_url_1, banner_url_2")
      .eq("id", shopId)
      .single();
    if (error) throw new Error(error.message);
    return shop;
  });

export const adminUpdateShop = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string(),
        shopSlug: z.string(),
        name: z.string().trim().min(1).max(100),
        shop_phone_number: z
          .string()
          .trim()
          .regex(/^\+[0-9]{7,15}$/, "must include country code, e.g. +14155551234"),
        banner_url_1: z.string().trim().max(1000).optional().default(""),
        banner_url_2: z.string().trim().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const shopId = await assertSession(data.token, data.shopSlug);
    const { error } = await supabaseAdmin
      .from("shop")
      .update({
        name: data.name,
        shop_phone_number: data.shop_phone_number,
        banner_url_1: data.banner_url_1 ?? "",
        banner_url_2: data.banner_url_2 || null,
      })
      .eq("id", shopId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Products ----
export const adminListProducts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string(), shopSlug: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const shopId = await assertSession(data.token, data.shopSlug);
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, slug, description, rate, original_price, banner_url_1, banner_url_2, category",
      )
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (products ?? []).map((p) => p.id);
    let offersMap: Record<string, { discount_price: number; expires_at: string; id: string }> = {};
    if (ids.length) {
      const { data: offers } = await supabaseAdmin
        .from("offers")
        .select("id, product_id, discount_price, expires_at")
        .in("product_id", ids);
      offersMap = Object.fromEntries(
        (offers ?? []).map((o) => [
          o.product_id,
          {
            id: o.id,
            discount_price: Number(o.discount_price),
            expires_at: o.expires_at,
          },
        ]),
      );
    }
    return (products ?? []).map((p) => ({
      ...p,
      rate: Number(p.rate),
      original_price: p.original_price !== null ? Number(p.original_price) : null,
      offer: offersMap[p.id] ?? null,
    }));
  });

const productSchema = z.object({
  token: z.string(),
  shopSlug: z.string(),
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(150),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  description: z.string().trim().max(5000).default(""),
  rate: z.number().nonnegative().max(1_000_000),
  original_price: z.number().nonnegative().max(1_000_000).nullable(),
  banner_url_1: z.string().trim().url().max(1000),
  banner_url_2: z.string().trim().url().max(1000).nullable(),
  category: z.string().trim().min(1).max(50).nullable(),
});

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data }) => {
    const shopId = await assertSession(data.token, data.shopSlug);
    const payload = {
      shop_id: shopId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      rate: data.rate,
      original_price: data.original_price,
      banner_url_1: data.banner_url_1,
      banner_url_2: data.banner_url_2,
      category: data.category,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", data.id)
        .eq("shop_id", shopId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505")
          throw new Error("That product slug is already used in this shop");
        throw new Error(error.message);
      }
      return { id: row.id };
    }
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ token: z.string(), shopSlug: z.string(), id: z.string().uuid() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const shopId = await assertSession(data.token, data.shopSlug);
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", data.id)
      .eq("shop_id", shopId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Offers ----
export const adminUpsertOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string(),
        shopSlug: z.string(),
        product_id: z.string().uuid(),
        discount_price: z.number().nonnegative().max(1_000_000),
        expires_at: z.string().datetime(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const shopId = await assertSession(data.token, data.shopSlug);
    // confirm product belongs to shop
    const { data: prod } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", data.product_id)
      .eq("shop_id", shopId)
      .maybeSingle();
    if (!prod) throw new Error("Product not found");
    const { error } = await supabaseAdmin.from("offers").upsert(
      {
        product_id: data.product_id,
        discount_price: data.discount_price,
        expires_at: data.expires_at,
      },
      { onConflict: "product_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string(),
        shopSlug: z.string(),
        product_id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const shopId = await assertSession(data.token, data.shopSlug);
    const { data: prod } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", data.product_id)
      .eq("shop_id", shopId)
      .maybeSingle();
    if (!prod) throw new Error("Product not found");
    const { error } = await supabaseAdmin
      .from("offers")
      .delete()
      .eq("product_id", data.product_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
