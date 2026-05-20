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

const checkoutAddressFields = {
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
    .transform((value) => value.toUpperCase())
    .optional()
    .refine((value) => !value || value.length === 2, {
      message: "Informe a UF com 2 letras ou deixe em branco.",
    }),
};

export const checkoutAddressSchema = z.object(checkoutAddressFields);

export const checkoutProfileSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  phone: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length >= 10 && value.length <= 11, {
      message: "Informe um telefone com DDD.",
    }),
  ...checkoutAddressFields,
});

export type CheckoutAddressFormValues = z.infer<typeof checkoutAddressSchema>;
export type CheckoutProfileFormValues = z.infer<typeof checkoutProfileSchema>;
