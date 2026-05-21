import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Store, Mail, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminLogin } from "@/lib/admin.functions";
import { saveSession } from "@/lib/admin-session";

const WA_REGISTER =
  "https://wa.me/916380691764?text=Hello%20Platform%20Admin!%20I%20would%20like%20to%20register%20my%20shop%20and%20sell%20products%20on%20your%20marketplace.%20Please%20share%20the%20details.";

export const Route = createFileRoute("/seller-login")({
  component: SellerLogin,
  head: () => ({
    meta: [
      { title: "Seller Login — SELLERPRODUCT" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SellerLogin() {
  const login = useServerFn(adminLogin);
  const navigate = useNavigate();
  const [shopSlug, setShopSlug] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = shopSlug.trim().toLowerCase();
    if (!slug) return;
    setLoading(true);
    try {
      const res = await login({ data: { shopSlug: slug, password } });
      saveSession(slug, res.token);
      toast.success(`Welcome back, ${res.shopName}`);
      navigate({ to: "/$shopSlug/admin", params: { shopSlug: slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.18em]">
              SellerProduct
            </span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Back to marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Seller sign-in</CardTitle>
            <CardDescription>
              Access your shop dashboard to manage products and flash sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Shop slug</Label>
                <Input
                  id="slug"
                  value={shopSlug}
                  onChange={(e) =>
                    setShopSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  placeholder="your-shop"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !password || !shopSlug}
                className="w-full"
              >
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join the platform</CardTitle>
            <CardDescription>
              Want to sell your products here? Contact us to register your shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-[#25D366] text-white hover:bg-[#22c35d]">
              <a href={WA_REGISTER} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Register via WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:roopesh5roopesh555@gmail.com">
                <Mail className="mr-2 h-4 w-4" />
                roopesh5roopesh555@gmail.com
              </a>
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Platform admin: +91 6380691764
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
