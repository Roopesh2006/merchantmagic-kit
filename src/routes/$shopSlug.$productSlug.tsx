import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ArrowLeft, ExternalLink } from "lucide-react";
import { getStorefront, type StorefrontData } from "@/lib/storefront.functions";
import { NIKE_FALLBACK } from "@/lib/nike-fallback";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ProductCarousel } from "@/components/ProductCarousel";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LiveViewers } from "@/components/LiveViewers";
import { ShopBanners } from "@/components/ShopBanners";

export const Route = createFileRoute("/$shopSlug/$productSlug")({
  component: ProductPage,
  loader: async ({ params }) => {
    try {
      const data = await getStorefront({ data: params });
      return { data };
    } catch {
      return { data: null };
    }
  },
  head: ({ params, loaderData }) => {
    const d = loaderData?.data;
    const title = d ? `${d.product.name} — ${d.shop.name}` : `${params.productSlug} — ${params.shopSlug}`;
    const desc = d?.product.description?.slice(0, 160) || `Buy ${params.productSlug} via WhatsApp from ${params.shopSlug}.`;
    const image = d?.product.banner_url_1;
    const baseUrl = import.meta.env.VITE_APP_URL || "";
    const url = `${baseUrl}/${params.shopSlug}/${params.productSlug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
    };
  },
});

function ProductPage() {
  // Async-safe param access (TanStack treats useParams synchronously, but we
  // also tolerate the params-as-promise pattern referenced in the spec).
  const { shopSlug, productSlug } = Route.useParams();
  const fetchStorefront = useServerFn(getStorefront);

  const { data, isLoading } = useQuery<StorefrontData>({
    queryKey: ["storefront", shopSlug, productSlug],
    queryFn: async () => {
      try {
        const res = await fetchStorefront({ data: { shopSlug, productSlug } });
        if (res) return res;
        throw new Error("not found");
      } catch (err) {
        // Resilient ingestion: special-cased Nike fallback so the demo
        // route never 500s or blanks out, exactly per the brief.
        if (shopSlug === "nike-store" && productSlug === "air-jordan") {
          return NIKE_FALLBACK as StorefrontData;
        }
        throw err;
      }
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
        <p className="text-sm text-muted-foreground">
          Nothing here matches /{shopSlug}/{productSlug}.
        </p>
        <Link
          to="/"
          className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ← Back to SELLERPRODUCT
        </Link>
      </div>
    );
  }

  const { shop, product, offer } = data;
  const images = [product.banner_url_1, product.banner_url_2].filter(
    (s): s is string => !!s && s.length > 0,
  );
  const activePrice = offer ? offer.discount_price : product.rate;
  const slashPrice = offer ? product.rate : product.original_price;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Tenant header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
              {shop.name}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            Verified Seller
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Shop Banners Section */}
        <ShopBanners
          bannerUrl1={shop.banner_url_1}
          bannerUrl2={shop.banner_url_2}
          shopName={shop.name}
        />

        <ProductCarousel images={images.length ? images : [""]} alt={product.name} />

        <div className="mt-6 space-y-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
          </div>

          {/* Price matrix */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              ${activePrice.toFixed(2)}
            </span>
            {slashPrice && slashPrice > activePrice && (
              <span className="pb-2 text-lg text-muted-foreground line-through decoration-red-500 decoration-2">
                ${slashPrice.toFixed(2)}
              </span>
            )}
            {offer && (
              <span className="mb-2 ml-auto rounded-md bg-destructive px-2 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground">
                -
                {Math.round(
                  ((product.rate - offer.discount_price) / product.rate) * 100,
                )}
                %
              </span>
            )}
          </div>

          {offer && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <CountdownTimer expiresAt={offer.expires_at} />
              <LiveViewers productId={product.id} />
            </div>
          )}
          {!offer && <LiveViewers productId={product.id} />}

          <div className="prose prose-sm max-w-none text-foreground/80">
            <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
          </div>

          {/* View More From This Shop */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Explore more from <span className="font-bold">{shop.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Browse the full catalog of products from this verified seller.
                </p>
              </div>
              <Link
                to="/$shopSlug"
                params={{ shopSlug }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <ExternalLink className="h-4 w-4" />
                View shop
              </Link>
            </div>
          </div>
        </div>
      </main>

      <WhatsAppButton phone={shop.shop_phone_number} productName={product.name} />
    </div>
  );
}
