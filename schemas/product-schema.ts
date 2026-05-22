import { z } from "zod";

function parseCurrencyValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  const sanitized = value.trim().replace(/[^\d,.-]/g, "");

  if (!sanitized) {
    return Number.NaN;
  }

  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : sanitized;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
}

const requiredCurrencySchema = z.preprocess(
  parseCurrencyValue,
  z
    .number({ error: "Informe um preço válido em reais." })
    .positive("O preço precisa ser maior que zero."),
);

const optionalCurrencySchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (typeof value === "string" && !value.trim()) {
      return undefined;
    }

    return parseCurrencyValue(value);
  },
  z
    .number({ error: "Informe um preço original válido em reais." })
    .positive("O preço original precisa ser maior que zero.")
    .optional(),
);

export const productSchema = z
  .object({
    name: z
      .string()
      .min(3, "Informe um nome com pelo menos 3 caracteres.")
      .max(120, "O nome pode ter no máximo 120 caracteres."),
    description: z
      .string()
      .min(10, "Descreva melhor o produto.")
      .max(1500, "A descrição está muito longa."),
    price: requiredCurrencySchema,
    compare_at_price: optionalCurrencySchema,
    category_id: z.string().min(1, "Selecione uma categoria."),
    stock: z.coerce
      .number({ error: "Informe o estoque." })
      .int("O estoque precisa ser inteiro.")
      .min(0, "O estoque não pode ser negativo."),
    variations: z
      .string()
      .max(600, "Use uma lista curta de variações separadas por vírgula.")
      .optional(),
    variation_label: z
      .string()
      .max(40, "Use um nome curto para o tipo de variação.")
      .optional(),
    variation_groups: z.string().max(3000, "Use uma lista menor de variações.").optional(),
    featured: z.coerce.boolean().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.compare_at_price !== undefined &&
      value.compare_at_price <= value.price
    ) {
      context.addIssue({
        code: "custom",
        path: ["compare_at_price"],
        message: "O preço original deve ser maior que o preço atual.",
      });
    }
  });

export type ProductFormValues = z.input<typeof productSchema>;
export type ProductPayload = z.output<typeof productSchema>;
