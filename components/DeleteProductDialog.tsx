"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
  permanent?: boolean;
  disabled?: boolean;
};

export function DeleteProductDialog({
  productName,
  action,
  permanent = false,
  disabled = false,
}: DeleteProductDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${permanent ? "Excluir permanentemente" : "Excluir"} ${productName}`}
          disabled={disabled}
          className={permanent ? "text-destructive hover:text-destructive" : undefined}
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {permanent ? "Excluir produto permanentemente?" : "Remover produto?"}
          </DialogTitle>
          <DialogDescription>
            {permanent
              ? "Esta acao apaga o produto do banco e nao pode ser desfeita."
              : "O produto deixara de aparecer na vitrine, mas continuara salvo para recuperacao."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-none bg-muted p-3 text-sm font-semibold">{productName}</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isPending || disabled}
            onClick={() => {
              startTransition(async () => {
                const result = await action();

                if (result.ok) {
                  toast.success(result.message);
                  router.refresh();
                } else {
                  toast.error(result.message);
                }
              });
            }}
          >
            {permanent ? "Excluir definitivamente" : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
