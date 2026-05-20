import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Store,
  Zap,
  MessageCircle,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createShop } from "@/lib/storefront.functions";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "SELLERPRODUCT — Single-product stores that sell on WhatsApp" },
      {
        name: "description",
        content:
          "Spin up a high-converting single-product storefront with flash-sale countdowns and one-tap WhatsApp checkout. No code required.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.18em]">
              SellerProduct
            </span>
          </Link>
          <a
            href="#create"
            className="text-sm font-medium text-foreground hover:underline underline-offset-4"
          >
            Create a store →
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" />
                Sell in 60 seconds
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                One product.
                <br />
                One link.
                <br />
                <span className="text-primary">Direct to WhatsApp.</span>
              </h1>
              <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
                SELLERPRODUCT spins up a focused single-product storefront with live
                flash-sale countdowns and one-tap checkout straight to your
                WhatsApp inbox.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <a href="#create">
                    Create your store
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/$shopSlug/$productSlug" params={{ shopSlug: "nike-store", productSlug: "air-jordan" }}>
                    See live demo
                  </Link>
                </Button>
              </div>
            </div>

            {/* Mocked storefront preview */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/15 blur-2xl" />
              <Card className="relative overflow-hidden">
                <div className="aspect-square w-full bg-muted">
                  <img
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80"
                    alt="Sample product"
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-lg font-bold">Air Jordan 1 Retro High OG</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">$169.00</span>
                    <span className="pb-1 text-sm text-muted-foreground line-through decoration-red-500 decoration-2">
                      $220.00
                    </span>
                    <span className="ml-auto rounded bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
                      -23%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {["23", "59", "12"].map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-md bg-foreground py-2 text-center text-background"
                      >
                        <div className="text-xl font-bold tabular-nums leading-none">
                          {v}
                        </div>
                        <div className="mt-0.5 text-[9px] uppercase tracking-widest opacity-70">
                          {["hrs", "min", "sec"][i]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-semibold text-white">
                    <MessageCircle className="h-4 w-4" />
                    Buy via WhatsApp
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
            <Feature
              icon={<Zap />}
              title="Flash-sale scarcity"
              body="Live countdown ticks down to the second. Discount price overrides the standard rate while active."
            />
            <Feature
              icon={<MessageCircle />}
              title="WhatsApp checkout"
              body="One tap opens a pre-filled WhatsApp message to your number. Zero payment integrations to wire up."
            />
            <Feature
              icon={<Shield />}
              title="Verified seller badge"
              body="Sticky tenant header with a glowing live indicator builds trust before the buyer scrolls."
            />
          </div>
        </section>

        {/* Create */}
        <section id="create" className="mx-auto max-w-xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Create your store
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your slug becomes your storefront URL:{" "}
            <span className="font-mono text-foreground">/your-slug/your-product</span>
          </p>
          <CreateShopForm />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
          SELLERPRODUCT · multi-tenant single-product commerce
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-foreground text-background">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function CreateShopForm() {
  const create = useServerFn(createShop);
  const navigate = useNavigate();
  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [phone, setPhone] = useState("+");
  const [password, setPassword] = useState("");

  const m = useMutation({
    mutationFn: () =>
      create({ data: { shopName, shopSlug, phone, password } }),
    onSuccess: (res) => {
      toast.success("Store created! Sign in to add products.");
      navigate({ to: "/$shopSlug/admin", params: { shopSlug: res.slug } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <form
      className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sn">Store name</Label>
          <Input
            id="sn"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Acme Coffee Co."
            required
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ss">URL slug</Label>
          <Input
            id="ss"
            value={shopSlug}
            onChange={(e) =>
              setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="acme-coffee"
            required
            maxLength={50}
            pattern="[a-z0-9-]+"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ph">WhatsApp number</Label>
        <Input
          id="ph"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+14155551234"
          required
        />
        <p className="text-xs text-muted-foreground">
          Country code required. Used for WhatsApp checkout links.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pw">Admin password</Label>
        <Input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">
          Used to sign in at /{shopSlug || "your-slug"}/admin. Minimum 6 characters.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={m.isPending} size="lg">
        {m.isPending ? "Creating…" : "Create store"}
      </Button>
    </form>
  );
}
