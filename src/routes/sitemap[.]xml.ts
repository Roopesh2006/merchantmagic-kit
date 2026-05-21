import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://merchantmagic-kit.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: string[] = [
          `  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
          `  <url><loc>${BASE_URL}/seller-login</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
        ];

        const { data: products } = await supabaseAdmin
          .from("products")
          .select("slug, updated_at, shop:shop_id(slug)")
          .limit(5000);

        for (const p of products ?? []) {
          const shop = p.shop as unknown as { slug: string } | null;
          if (!shop) continue;
          urls.push(
            `  <url><loc>${BASE_URL}/${shop.slug}/${p.slug}</loc><lastmod>${new Date(
              p.updated_at,
            ).toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`,
          );
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
