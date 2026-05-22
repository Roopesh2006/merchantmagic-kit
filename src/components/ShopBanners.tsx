import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShopBannersProps {
  banner_url_1: string | null | undefined;
  banner_url_2: string | null | undefined;
  shopName: string;
}

export function ShopBanners({ banner_url_1, banner_url_2, shopName }: ShopBannersProps) {
  const Banners = [banner_url_1, banner_url_2].filter(
    (s): s is string => !!s && s.length > 0,
  );

  if (banners.length === 0) return null;

  if (banners.length === 1) {
    return (
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-muted">
        <img
          src={banners[0]}
          alt={`${shopName} banner`}
          className="aspect-[21/9] w-full object-cover sm:aspect-[3/1]"
        />
      </div>
    );
  }

  return <AutoCarousel banners={banners} shopName={shopName} />;
}

function AutoCarousel({ banners, shopName }: { banners: string[]; shopName: string }) {

  const [current, setCurrent] = useState(0);

  useEffect(() => {

    const id = setInterval(() => {

      setCurrent((prev) => (prev + 1) % banners.length);

    }, 5000);

    return () => clearInterval(id);

  }, [banners.length]);

  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

  const next = () => setCurrent((c) => (c + 1) % banners.length);

  return (

    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-muted group">

      <div

        className="flex transition-transform duration-700 ease-in-out"

        style={{ transform: `translateX(-${current * 100}%)` }}

      >

        {banners.map((src, i) => (

          <div key={i} className="min-w-0 w-full flex-shrink-0">

            <img

              src={src}

              alt={`${shopName} banner ${i + 1}`}

              className="aspect-[21/9] w-full object-cover sm:aspect-[3/1]"

            />

          </div>

        ))}

      </div>

      <button

        onClick={prev}

        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"

        aria-label="Previous banner"

      >

        <ChevronLeft className="h-5 w-5" />

      </button>

      <button

        onClick={next}

        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"

        aria-label="Next banner"

      >

        <ChevronRight className="h-5 w-5" />

      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">

        {banners.map((_, i) => (

          <button

            key={i}

            onClick={() => setCurrent(i)}

            className={`h-2 w-2 rounded-full transition-all ${

              i === current ? "bg-foreground scale-125" : "bg-foreground/40"

            }`}

            aria-label={`Go to banner ${i + 1}`}

          />

        ))}

      </div>

    </div>

  );

}

