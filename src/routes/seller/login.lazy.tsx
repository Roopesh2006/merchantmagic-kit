import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Store, ArrowRight, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { adminLogin } from "../../lib/admin.functions";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../components/ui/card";

const SESSION_KEY = "sellerproduct.merchant.session";
const WA_REGISTER =
  "https://wa.me/916380691764?text=Hello%20Platform%20Admin!%20I%20would%20like%20to%20register%20my%20shop%20and%20sell%20products%20on%20your%20marketplace.";

export const Route = createLazyFileRoute("/seller/login")({
  component: SellerLoginPage,
});

function SellerLoginPage() {
  const login = useServerFn(adminLogin);
  const navigate = useNavigate();
  const [shopSlug, setShopSlug] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = shopSlug.trim().toLowerCase();
    if (!slug || !password) return;
    setLoading(true);
    try {
      const res = await login({ data: { shopSlug: slug, password } });
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ token: res.token, shopSlug: slug, shopName: res.shopName }),
      );
      toast.success(`Welcome back, ${res.shopName}`);
      navigate({ to: "/merchant-admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-muted/20 flex flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.18em]">
              SellerProduct
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to marketplace
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Merchant sign-in</h1>
            <p className="text-sm text-muted-foreground">
              Access your shop dashboard to manage products and flash sales.
            </p>
          </div>

          <Card className="shadow-xl border-border/60">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>
                Enter your shop credentials to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Shop handle / slug</Label>
                  <Input
                    id="slug"
                    value={shopSlug}
                    onChange={(e) =>
                      setShopSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    placeholder="your-shop"
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Access password</Label>
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !shopSlug || !password}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex-col gap-3 border-t bg-muted/30 pt-4">
              <p className="text-xs text-muted-foreground text-center">
                Don't have a shop yet? Contact the platform team to register.
              </p>
              <div className="flex w-full gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <a href={WA_REGISTER} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <a href="mailto:roopesh5roopesh555@gmail.com">
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Email
                  </a>
                </Button>
              </div>
            </CardFooter>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Protected merchant area · SELLERPRODUCT marketplace
          </p>
        </div>
      </main>
    </div>
  );
}
