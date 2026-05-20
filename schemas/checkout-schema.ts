import { z } from "zod";

function optionalText(minLength: number, message: string) {
  return z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length >= minLength, {
      message,
    });
}

export const checkoutSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  phone: z.string().min(10, "Informe um telefone com DDD."),
  document: z.string().optional(),
  cep: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.replace(/\D/g, "").length === 8, {
      message: "Informe um CEP com 8 dígitos.",
    }),
  address: optionalText(5, "Informe o endereço ou deixe em branco."),
  number: z.string().trim().optional(),
  city: optionalText(2, "Informe a cidade ou deixe em branco."),
  state: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length === 2, {
      message: "Informe a UF com 2 letras ou deixe em branco.",
    }),
  acceptPrivacy: z.boolean().refine(Boolean, {
    message: "Aceite a Política de Privacidade para continuar.",
  }),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
