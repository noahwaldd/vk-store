import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(80, "O nome pode ter no máximo 80 caracteres."),
  slug: z
    .string()
    .max(100, "O slug pode ter no máximo 100 caracteres.")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(240, "A descrição pode ter no máximo 240 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type CategoryPayload = z.output<typeof categorySchema>;
