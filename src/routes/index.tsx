import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Store, Mail, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getMarketplace, type MarketplaceProduct } from "@/lib/storefront.functions";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Beauty", "Sneakers", "Sports", "Toys", "Other"];

const WA_REGISTER =
  "https://wa.me/916380691764?text=Hello%20Platform%20Admin!%20I%20would%20like%20to%20register%20my%20shop%20and%20sell%20products%20on%20your%20marketplace.%20Please%20share%20the%20details.";

export const Route = createFileRoute("/")({
  component: Marketplace,
  head: () => ({
    meta: [
      { title: "SELLERPRODUCT — Marketplace of curated single-product stores" },
      {
        name: "description",
        content:
          "Browse trending products from verified shops. Flash deals, fast checkout via WhatsApp.",
      },
    ],
  }),
});

function Marketplace() {
  const fetchMarketplace = useServerFn(getMarketplace);
  const { data, isLoading } = useQuery({
    queryKey: ["marketplace"],
    queryFn: () => fetchMarketplace(),
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const products = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "All" && (p.category ?? "Other") !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, search, category]);

  const trending = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b.offer ? 1 : 0) - (a.offer ? 1 : 0))
        .slice(0, 12),
    [products],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background">
              <Store className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline text-sm font-bold uppercase tracking-[0.18em]">
              SellerProduct
            </span>
          </Link>
          <div className="relative flex-1 max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-9"
            />
          </div>
          <Link
            to="/seller/login"
            className="shrink-0 text-sm font-medium text-foreground hover:underline underline-offset-4"
          >
            Seller Login
          </Link>
        </div>
      </header>

      {/* Rolling marquee */}
      {trending.length > 0 && (
        <section className="border-b border-border bg-muted/30 overflow-hidden">
          <div className="group relative py-3">
            <div className="flex w-max animate-marquee gap-3 px-4 hover:[animation-play-state:paused]">
              {[...trending, ...trending].map((p, i) => (
                <Link
                  key={`${p.id}-${i}`}
                  to="/$shopSlug/$productSlug"
                  params={{ shopSlug: p.shop_slug, productSlug: p.slug }}
                  className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 shadow-sm hover:border-foreground/40"
                >
                  <img
                    src={p.banner_url_1}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium whitespace-nowrap">
                    {p.name}
                  </span>
                  {p.offer && (
                    <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                      SALE
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category pills */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3">
          <div className="flex gap-2 w-max">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  category === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No products match your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Become a Seller</p>
          <p className="mt-2">
            <a
              href={WA_REGISTER}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              +91 6380691764
            </a>
            {" · "}
            <a
              href="mailto:roopesh5roopesh555@gmail.com"
              className="hover:underline"
            >
              roopesh5roopesh555@gmail.com
            </a>
          </p>
          <p className="mt-4 text-xs">
            SELLERPRODUCT · curated multi-tenant marketplace
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ p }: { p: MarketplaceProduct }) {
  const showOffer = p.offer && new Date(p.offer.expires_at) > new Date();
  const price = showOffer ? p.offer!.discount_price : p.rate;
  const compareAt = showOffer ? p.rate : p.original_price;
  const pct =
    compareAt && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : null;

  return (
    <Link
      to="/$shopSlug/$productSlug"
      params={{ shopSlug: p.shop_slug, productSlug: p.slug }}
      className="group block"
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square w-full bg-muted">
          <img
            src={p.banner_url_1}
            alt={p.name}
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
            {p.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{p.shop_name}</p>
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

// Re-export icons used in footer (Mail / MessageCircle currently unused but kept available)
export { Mail, MessageCircle };
