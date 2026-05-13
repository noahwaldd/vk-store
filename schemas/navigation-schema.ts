import { z } from "zod";

export const navigationLocations = ["primary", "secondary", "footer"] as const;

export const navigationItemSchema = z.object({
  label: z
    .string()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(40, "O nome pode ter no máximo 40 caracteres."),
  href: z
    .string()
    .min(1, "Informe o destino do link.")
    .refine(
      (value) =>
        value.startsWith("/") ||
        value.startsWith("https://") ||
        value.startsWith("http://"),
      "Use um caminho começando com / ou uma URL completa.",
    ),
  location: z.enum(navigationLocations),
  position: z.coerce
    .number({ error: "Informe a ordem." })
    .int("A ordem precisa ser um número inteiro.")
    .min(0, "A ordem não pode ser negativa."),
  enabled: z.coerce.boolean().optional(),
});

export type NavigationItemPayload = z.output<typeof navigationItemSchema>;
