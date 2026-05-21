import { MessageCircle } from "lucide-react";

interface Props {
  phone: string;
  productName: string;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function WhatsAppButton({ phone, productName }: Props) {
  const clean = phone.replace(/[^\d]/g, "");
  const text = `Hello! I am interested in buying ${productName} from your store. Please share the order details.`;
  const href = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;

  const handleClick = () => {
    try {
      if (typeof window !== "undefined") {
        window.fbq?.("track", "InitiateCheckout", { content_name: productName });
        window.gtag?.("event", "begin_checkout", {
          items: [{ item_name: productName }],
        });
      }
    } catch {
      /* noop */
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 bg-[#25D366] py-4 text-base font-semibold text-white shadow-[0_-8px_24px_-12px_rgba(37,211,102,0.5)] transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:left-1/2 sm:inset-x-auto sm:w-[420px] sm:-translate-x-1/2 sm:rounded-full sm:py-4 sm:shadow-[0_12px_32px_-8px_rgba(37,211,102,0.45)]"
    >
      <MessageCircle className="h-5 w-5" />
      Buy via WhatsApp
    </a>
  );
}
