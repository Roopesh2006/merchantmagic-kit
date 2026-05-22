import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Tag,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  adminLogin,
  adminGetShop,
  adminUpdateShop,
  adminListProducts,
  adminUpsertProduct,
  adminDeleteProduct,
  adminUpsertOffer,
  adminDeleteOffer,
  adminChangePassword,
} from "@/lib/admin.functions";
import {
  saveSession,
  loadSession,
  clearSession,
} from "@/lib/admin-session";

export const Route = createFileRoute("/$shopSlug/admin")({
  component: AdminPage,
  head: ({ params }) => ({
    meta: [{ title: `Admin — ${params.shopSlug}` }, { name: "robots", content: "noindex" }],
  }),
});

function AdminPage() {
  const { shopSlug } = Route.useParams();
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setToken(loadSession(shopSlug));
    setHydrated(true);
  }, [shopSlug]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!token) {
    return (
      <LoginCard
        shopSlug={shopSlug}
        onLogin={(t) => {
          saveSession(shopSlug, t);
          setToken(t);
        }}
      />
    );
  }

  return (
    <Dashboard
      shopSlug={shopSlug}
      token={token}
      onLogout={() => {
        clearSession(shopSlug);
        setToken(null);
      }}
      onInvalidToken={() => {
        clearSession(shopSlug);
        setToken(null);
      }}
    />
  );
}

function LoginCard({
  shopSlug,
  onLogin,
}: {
  shopSlug: string;
  onLogin: (token: string) => void;
}) {
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ data: { shopSlug, password } });
      toast.success(`Welcome back, ${res.shopName}`);
      onLogin(res.token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Admin sign-in</CardTitle>
          <CardDescription>
            Enter the admin password for{" "}
            <span className="font-mono text-foreground">/{shopSlug}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" disabled={loading || !password} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:underline">
                ← Back to SELLERPRODUCT
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard({
  shopSlug,
  token,
  onLogout,
  onInvalidToken,
}: {
  shopSlug: string;
  token: string;
  onLogout: () => void;
  onInvalidToken: () => void;
}) {
  const qc = useQueryClient();
  const getShop = useServerFn(adminGetShop);
  const listProducts = useServerFn(adminListProducts);

  const shopQ = useQuery({
    queryKey: ["admin-shop", shopSlug],
    queryFn: () => getShop({ data: { token, shopSlug } }),
    retry: false,
  });
  const productsQ = useQuery({
    queryKey: ["admin-products", shopSlug],
    queryFn: () => listProducts({ data: { token, shopSlug } }),
    retry: false,
  });

  useEffect(() => {
    const e = shopQ.error || productsQ.error;
    if (e && /Unauthorized|expired|Invalid session/i.test((e as Error).message)) {
      toast.error("Session expired. Please sign in again.");
      onInvalidToken();
    }
  }, [shopQ.error, productsQ.error, onInvalidToken]);

  const [editing, setEditing] = useState<ProductFormState | null>(null);
  const [offerFor, setOfferFor] = useState<{ id: string; name: string; existing: { discount_price: number; expires_at: string } | null } | null>(null);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            <h1 className="text-xl font-bold text-foreground">
              {shopQ.data?.name ?? shopSlug}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/${shopSlug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                View store
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Manage inventory and flash-sale offers
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  setEditing({
                    id: null,
                    name: "",
                    slug: "",
                    description: "",
                    rate: "",
                    original_price: "",
                    banner_url_1: "",
                    banner_url_2: "",
                    category: "",
                  })
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New product
              </Button>
            </CardHeader>
            <CardContent>
              {productsQ.isLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {productsQ.data && productsQ.data.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No products yet. Click <strong>New product</strong> to get started.
                </p>
              )}
              <ul className="space-y-3">
                {productsQ.data?.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <img
                      src={p.banner_url_1}
                      alt=""
                      className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility =
                          "hidden";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">
                          {p.name}
                        </p>
                        {p.offer && (
                          <Badge variant="destructive" className="text-[10px]">
                            Flash sale
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        /{shopSlug}/{p.slug} · ${Number(p.rate).toFixed(2)}
                        {p.offer && (
                          <>
                            {" "}
                            → <span className="text-destructive">
                              ${Number(p.offer.discount_price).toFixed(2)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setOfferFor({
                            id: p.id,
                            name: p.name,
                            existing: p.offer,
                          })
                        }
                        title="Manage offer"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditing({
                            id: p.id,
                            name: p.name,
                            slug: p.slug,
                            description: p.description,
                            rate: String(p.rate),
                            original_price:
                              p.original_price !== null ? String(p.original_price) : "",
                            banner_url_1: p.banner_url_1,
                            banner_url_2: p.banner_url_2 ?? "",
                            category: (p as { category: string | null }).category ?? "",
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteProductButton
                        id={p.id}
                        name={p.name}
                        shopSlug={shopSlug}
                        token={token}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <ShopSettingsCard
            shopSlug={shopSlug}
            token={token}
            shop={shopQ.data}
            onSaved={() => qc.invalidateQueries({ queryKey: ["admin-shop", shopSlug] })}
          />
          <ChangePasswordCard
            shopSlug={shopSlug}
            token={token}
          />
        </aside>
      </main>

      {editing && (
        <ProductDialog
          shopSlug={shopSlug}
          token={token}
          state={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {offerFor && (
        <OfferDialog
          shopSlug={shopSlug}
          token={token}
          product={offerFor}
          onClose={() => setOfferFor(null)}
        />
      )}
    </div>
  );
}

function DeleteProductButton({
  id,
  name,
  shopSlug,
  token,
}: {
  id: string;
  name: string;
  shopSlug: string;
  token: string;
}) {
  const qc = useQueryClient();
  const del = useServerFn(adminDeleteProduct);
  const m = useMutation({
    mutationFn: () => del({ data: { id, shopSlug, token } }),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products", shopSlug] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (confirm(`Delete "${name}"? This also removes its offer.`)) m.mutate();
      }}
      disabled={m.isPending}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

function ShopSettingsCard({
  shopSlug,
  token,
  shop,
  onSaved,
}: {
  shopSlug: string;
  token: string;
  shop: { name: string; shop_phone_number: string; banner_url_1: string; banner_url_2: string | null } | undefined;
  onSaved: () => void;
}) {
  const update = useServerFn(adminUpdateShop);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [banner1, setBanner1] = useState("");
  const [banner2, setBanner2] = useState("");

  useEffect(() => {
    if (shop) {
      setName(shop.name);
      setPhone(shop.shop_phone_number);
      setBanner1(shop.banner_url_1 ?? "");
      setBanner2(shop.banner_url_2 ?? "");
    }
  }, [shop]);

  const m = useMutation({
    mutationFn: () =>
      update({
        data: {
          token,
          shopSlug,
          name,
          shop_phone_number: phone,
          banner_url_1: banner1,
          banner_url_2: banner2 || null,
        },
      }),
    onSuccess: () => {
      toast.success("Shop updated");
      onSaved();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop profile</CardTitle>
        <CardDescription>Visible to customers on your storefront.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="shop-name">Store name</Label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-phone">WhatsApp phone</Label>
            <Input
              id="shop-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155551234"
              required
            />
            <p className="text-xs text-muted-foreground">
              Must include country code (starts with +).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-banner-1">Banner image URL 1</Label>
            <Input
              id="shop-banner-1"
              value={banner1}
              onChange={(e) => setBanner1(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-banner-2">Banner image URL 2 (optional)</Label>
            <Input
              id="shop-banner-2"
              value={banner2}
              onChange={(e) => setBanner2(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" disabled={m.isPending} className="w-full">
            {m.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard({
  shopSlug,
  token,
}: {
  shopSlug: string;
  token: string;
}) {
  const changePw = useServerFn(adminChangePassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const m = useMutation({
    mutationFn: () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }
      return changePw({
        data: { token, shopSlug, currentPassword, newPassword },
      });
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Update your admin password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="current-pw">Current password</Label>
            <Input
              id="current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirm new password</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={m.isPending} className="w-full">
            {m.isPending ? "Changing…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type ProductFormState = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  rate: string;
  original_price: string;
  banner_url_1: string;
  banner_url_2: string;
  category: string;
};

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sneakers", "Sports", "Toys", "Other"] as const;

function ProductDialog({
  shopSlug,
  token,
  state,
  onClose,
}: {
  shopSlug: string;
  token: string;
  state: ProductFormState;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertProduct);
  const [f, setF] = useState(state);

  const m = useMutation({
    mutationFn: () =>
      upsert({
        data: {
          token,
          shopSlug,
          id: f.id,
          name: f.name,
          slug: f.slug,
          description: f.description,
          rate: Number(f.rate),
          original_price: f.original_price === "" ? null : Number(f.original_price),
          banner_url_1: f.banner_url_1,
          banner_url_2: f.banner_url_2 === "" ? null : f.banner_url_2,
          category: f.category === "" ? null : f.category,
        },
      }),
    onSuccess: () => {
      toast.success(f.id ? "Product updated" : "Product created");
      qc.invalidateQueries({ queryKey: ["admin-products", shopSlug] });
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{f.id ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            All fields except original price &amp; second image are required.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Name</Label>
              <Input
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>URL slug</Label>
              <Input
                value={f.slug}
                onChange={(e) => setF({ ...f, slug: e.target.value })}
                placeholder="air-jordan"
                required
              />
              <p className="text-xs text-muted-foreground">
                /{shopSlug}/<span className="font-mono">{f.slug || "slug"}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={f.rate}
                onChange={(e) => setF({ ...f, rate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Original price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={f.original_price}
                onChange={(e) => setF({ ...f, original_price: e.target.value })}
                placeholder="optional"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Category</Label>
              <Select
                value={f.category || undefined}
                onValueChange={(v) => setF({ ...f, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Banner image URL 1</Label>
              <Input
                type="url"
                value={f.banner_url_1}
                onChange={(e) => setF({ ...f, banner_url_1: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Banner image URL 2 (optional)</Label>
              <Input
                type="url"
                value={f.banner_url_2}
                onChange={(e) => setF({ ...f, banner_url_2: e.target.value })}
                placeholder="leave blank for single image"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={5}
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Saving…" : "Save product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OfferDialog({
  shopSlug,
  token,
  product,
  onClose,
}: {
  shopSlug: string;
  token: string;
  product: {
    id: string;
    name: string;
    existing: { discount_price: number; expires_at: string } | null;
  };
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertOffer);
  const del = useServerFn(adminDeleteOffer);

  const [price, setPrice] = useState(
    product.existing ? String(product.existing.discount_price) : "",
  );
  const [date, setDate] = useState<Date | undefined>(
    product.existing ? new Date(product.existing.expires_at) : undefined,
  );
  const [time, setTime] = useState(() => {
    const d = product.existing ? new Date(product.existing.expires_at) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  const m = useMutation({
    mutationFn: () => {
      if (!date) throw new Error("Pick an expiry date");
      const [h, mi] = time.split(":").map(Number);
      const expires = new Date(date);
      expires.setHours(h, mi, 0, 0);
      return upsert({
        data: {
          token,
          shopSlug,
          product_id: product.id,
          discount_price: Number(price),
          expires_at: expires.toISOString(),
        },
      });
    },
    onSuccess: () => {
      toast.success("Offer saved");
      qc.invalidateQueries({ queryKey: ["admin-products", shopSlug] });
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const dm = useMutation({
    mutationFn: () => del({ data: { token, shopSlug, product_id: product.id } }),
    onSuccess: () => {
      toast.success("Offer removed");
      qc.invalidateQueries({ queryKey: ["admin-products", shopSlug] });
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flash sale — {product.name}</DialogTitle>
          <DialogDescription>
            Discount price overrides the standard rate while active. Countdown ticks
            until the expiry timestamp.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Discount price ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Expires on</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-2 flex-row justify-between sm:justify-between">
            {product.existing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => dm.mutate()}
                disabled={dm.isPending}
                className="text-destructive hover:text-destructive"
              >
                <X className="mr-1.5 h-4 w-4" />
                Remove offer
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={m.isPending}>
                {m.isPending ? "Saving…" : "Save offer"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
