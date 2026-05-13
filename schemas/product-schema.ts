import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(3, "Informe um nome com pelo menos 3 caracteres.")
    .max(120, "O nome pode ter no máximo 120 caracteres."),
  description: z
    .string()
    .min(10, "Descreva melhor o produto.")
    .max(1500, "A descrição está muito longa."),
  price: z.coerce
    .number({ error: "Informe um preço válido." })
    .positive("O preço precisa ser maior que zero."),
  compare_at_price: z.coerce
    .number()
    .positive("O preço original precisa ser maior que zero.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  category_id: z.string().min(1, "Selecione uma categoria."),
  stock: z.coerce
    .number({ error: "Informe o estoque." })
    .int("O estoque precisa ser inteiro.")
    .min(0, "O estoque não pode ser negativo."),
  variations: z
    .string()
    .max(240, "Use uma lista curta de variações separadas por vírgula.")
    .optional(),
  featured: z.coerce.boolean().optional(),
  image_url: z.string().url("Informe uma URL válida.").optional().or(z.literal("")),
});

export type ProductFormValues = z.input<typeof productSchema>;
export type ProductPayload = z.output<typeof productSchema>;
