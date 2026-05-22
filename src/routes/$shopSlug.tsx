import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ShieldCheck, Store } from "lucide-react";
import { getShopPage, type ShopPageData } from "@/lib/storefront.functions";
import { Card, CardContent } from "@/components/ui/card";
import { ShopBanners } from "@/components/ShopBanners";

export const Route = createFileRoute("/$shopSlug")({
  component: ShopPage,
  loader: async ({ params }) => {
    try {
      const data = await getShopPage({ data: { shopSlug: params.shopSlug } });
      return { data };
    } catch {
      return { data: null };
    }
  },
  head: ({ params, loaderData }) => {
    const d = loaderData?.data;
    const title = d ? `${d.shop.name} — Browse All Products` : `${params.shopSlug}`;
    const desc = d ? `Browse all products from ${d.shop.name}. Shop via WhatsApp.` : `Shop ${params.shopSlug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        ...(d?.shop.banner_url_1 ? [{ property: "og:image", content: d.shop.banner_url_1 }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function ShopPage() {
  const { shopSlug } = Route.useParams();
  const fetchShopPage = useServerFn(getShopPage);

  const { data, isLoading } = useQuery<ShopPageData>({
    queryKey: ["shop-page", shopSlug],
    queryFn: async () => {
      const res = await fetchShopPage({ data: { shopSlug } });
      if (res) return res;
      throw new Error("Shop not found");
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
        <h1 className="text-2xl font-bold text-foreground">Shop not found</h1>
        <p className="text-sm text-muted-foreground">
          No shop exists at /{shopSlug}.
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

  const shop = (data as any).shop;
  const products = (data as any).products || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Marketplace</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              Verified Seller
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Shop Banners */}
        <ShopBanners
          bannerUrl1={shop.banner_url_1}
          bannerUrl2={shop.banner_url_2}
          shopName={shop.name}
        />

        {/* Shop Info */}
        <div className="mt-6 mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {shop.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              This shop hasn't listed any products yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} shopSlug={shopSlug} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            ← Back to marketplace
          </Link>
          <p className="mt-2 text-xs">
            {shop.name} · SELLERPRODUCT
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({
  product,
  shopSlug,
}: {
  product: ShopPageData["products"][number];
  shopSlug: string;
}) {
  const showOffer = product.offer && new Date(product.offer.expires_at) > new Date();
  const price = showOffer ? product.offer!.discount_price : product.rate;
  const compareAt = showOffer ? product.rate : product.original_price;
  const pct =
    compareAt && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : null;

  return (
    <Link
      to="/$shopSlug/$productSlug"
      params={{ shopSlug, productSlug: product.slug }}
      className="group block"
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square w-full bg-muted">
          <img
            src={product.banner_url_1}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {pct !== null && (
            <span className="absolute left-2 top-2 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
              -{pct}%
            </span>
          )}
        </div>
        <CardContent className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-base font-bold text-foreground">
              ${price.toFixed(2)}
            </span>
            {compareAt && compareAt > price && (
              <span className="text-xs text-muted-foreground line-through">
                ${compareAt.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

