import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  productId: string;
}

export function LiveViewers({ productId }: Props) {
  const [count, setCount] = useState(0);
  const [fallback] = useState(() => 3 + Math.floor(Math.random() * 5)); // 3-7

  useEffect(() => {
    const clientId =
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));

    const channel = supabase.channel(`product-presence:${productId}`, {
      config: { presence: { key: clientId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const display = count > 1 ? count : fallback;

  return (
    <div className="flex items-center gap-2 rounded-md bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-orange-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
      </span>
      🔥 {display} people are viewing this product right now!
    </div>
  );
}
