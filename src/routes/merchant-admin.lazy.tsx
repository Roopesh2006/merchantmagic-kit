import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, LogOut, Store, Package, Zap, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminGetShop,
  adminUpdateShop,
  adminListProducts,
  adminUpsertProduct,
  adminUpsertOffer,
} from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createLazyFileRoute("/merchant-admin")({
  component: MerchantAdmin,
});

const SESSION_KEY = "sellerproduct.merchant.session";

type Session = {
  token: string;
  shopSlug: string;
  shopName: string;
};

type Shop = {
  id: string;
  name: string;
  slug: string;
  shop_phone_number: string;
  banner_url_1: string;
  banner_url_2: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  rate: number;
  original_price: number | null;
};

function MerchantAdmin() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let parsed: Session | null = null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) parsed = JSON.parse(raw) as Session;
    } catch {
      /* ignore */
    }
    if (!parsed?.token) {
      navigate({ to: "/seller/login", replace: true });
      return;
    }
    setSession(parsed);
    setBootstrapped(true);
  }, [navigate]);

  if (!bootstrapped || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Workspace
      session={session}
      onLogout={() => {
        localStorage.removeItem(SESSION_KEY);
        navigate({ to: "/seller/login", replace: true });
      }}
    />
  );
}

function Workspace({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const getShop = useServerFn(adminGetShop);
  const listProducts = useServerFn(adminListProducts);

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [s, p] = await Promise.all([
        getShop({ data: { token: session.token, shopSlug: session.shopSlug } }),
        listProducts({ data: { token: session.token, shopSlug: session.shopSlug } }),
      ]);
      setShop(s as Shop);
      setProducts(p as ProductRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load workspace");
      if (err instanceof Error && /session|unauth/i.test(err.message)) onLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !shop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Merchant Workspace</p>
            <h1 className="text-xl font-bold">{shop.name}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <ShopSettingsCard session={session} shop={shop} onSaved={refresh} />
        <InventoryCard session={session} products={products} onSaved={refresh} />
        <FlashSaleCard session={session} products={products} onSaved={refresh} />
      </main>
    </div>
  );
}

function ShopSettingsCard({
  session,
  shop,
  onSaved,
}: {
  session: Session;
  shop: Shop;
  onSaved: () => void;
}) {
  const update = useServerFn(adminUpdateShop);
  const [name, setName] = useState(shop.name);
  const [phone, setPhone] = useState(shop.shop_phone_number);
  const [b1, setB1] = useState(shop.banner_url_1 ?? "");
  const [b2, setB2] = useState(shop.banner_url_2 ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await update({
        data: {
          token: session.token,
          shopSlug: session.shopSlug,
          name,
          shop_phone_number: phone,
          banner_url_1: b1,
          banner_url_2: b2 || null,
        },
      });
      toast.success("Shop settings updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" /> Shop Settings
        </CardTitle>
        <CardDescription>Update your storefront branding and contact details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Shop name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+14155551234" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Banner image 1 URL</Label>
            <Input value={b1} onChange={(e) => setB1(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Banner image 2 URL (optional)</Label>
            <Input value={b2} onChange={(e) => setB2(e.target.value)} placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function InventoryCard({
  session,
  products,
  onSaved,
}: {
  session: Session;
  products: ProductRow[];
  onSaved: () => void;
}) {
  const upsert = useServerFn(adminUpsertProduct);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsert({
        data: {
          token: session.token,
          shopSlug: session.shopSlug,
          id: null,
          name,
          slug,
          description,
          rate: Number(rate),
          original_price: originalPrice ? Number(originalPrice) : null,
          banner_url_1: banner,
          banner_url_2: null,
          category: null,
        },
      });
      toast.success("Product created");
      setName("");
      setSlug("");
      setDescription("");
      setRate("");
      setOriginalPrice("");
      setBanner("");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" /> Inventory
        </CardTitle>
        <CardDescription>Add a new product to your catalog.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="air-jordan"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Base rate</Label>
            <Input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Original price (optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Banner image URL</Label>
            <Input value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://..." required />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create product
            </Button>
          </div>
        </form>

        {products.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your products ({products.length})
            </p>
            <ul className="divide-y">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">${p.rate.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FlashSaleCard({
  session,
  products,
  onSaved,
}: {
  session: Session;
  products: ProductRow[];
  onSaved: () => void;
}) {
  const upsertOffer = useServerFn(adminUpsertOffer);
  const [productId, setProductId] = useState("");
  const [discount, setDiscount] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !date) {
      toast.error("Pick a product and an expiry date");
      return;
    }
    setSaving(true);
    try {
      await upsertOffer({
        data: {
          token: session.token,
          shopSlug: session.shopSlug,
          product_id: productId,
          discount_price: Number(discount),
          expires_at: date.toISOString(),
        },
      });
      toast.success("Flash sale launched");
      setProductId("");
      setDiscount("");
      setDate(undefined);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Launch failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" /> Flash Sale Launcher
        </CardTitle>
        <CardDescription>Create urgency with a time-limited discount.</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a product first to launch a flash sale.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — ${p.rate.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount price</Label>
              <Input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Expires at</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP p") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        const next = new Date(d);
                        next.setHours(23, 59, 0, 0);
                        setDate(next);
                      }
                    }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Launch flash sale
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
