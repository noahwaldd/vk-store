"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import type { ActionResult } from "@/app/admin/produtos/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteProductDialogProps = {
  productName: string;
  action: () => Promise<ActionResult>;
};

export function DeleteProductDialog({ productName, action }: DeleteProductDialogProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Excluir ${productName}`}>
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover produto?</DialogTitle>
          <DialogDescription>
            O produto deixará de aparecer na vitrine, mas continuará salvo no banco com
            soft delete.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-none bg-muted p-3 text-sm font-semibold">{productName}</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await action();

                if (result.ok) {
                  toast.success(result.message);
                } else {
                  toast.error(result.message);
                }
              });
            }}
          >
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
