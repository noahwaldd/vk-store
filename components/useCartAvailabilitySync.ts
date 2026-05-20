"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { syncCartItemsAction } from "@/app/carrinho/actions";
import { hydrateCartStore, useCartStore } from "@/store/cart-store";

function cartSignature() {
  return JSON.stringify(
    useCartStore.getState().items.map((item) => ({
      id: item.product.id,
      quantity: item.quantity,
      variation: item.variation ?? null,
      stock: item.product.stock,
    })),
  );
}

export function useCartAvailabilitySync() {
  const replaceItems = useCartStore((state) => state.replaceItems);

  useEffect(() => {
    let canceled = false;

    async function syncCart() {
      await hydrateCartStore();

      if (canceled) {
        return;
      }

      const before = cartSignature();
      const currentItems = useCartStore.getState().items;

      if (!currentItems.length) {
        return;
      }

      const result = await syncCartItemsAction(currentItems);

      if (canceled) {
        return;
      }

      replaceItems(result.items);

      if (result.removedCount > 0) {
        toast.info("Removemos do carrinho itens que saíram da loja.", {
          id: "cart-sync-removed",
        });
      }

      if (before !== cartSignature() && result.removedCount === 0) {
        toast.info("Atualizamos a disponibilidade do carrinho.", {
          id: "cart-sync-updated",
        });
      }
    }

    void syncCart();

    return () => {
      canceled = true;
    };
  }, [replaceItems]);
}
