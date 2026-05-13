import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo."),
  email: z.string().email("Informe um e-mail válido."),
  phone: z.string().min(10, "Informe um telefone com DDD."),
  document: z.string().optional(),
  cep: z.string().min(8, "Informe o CEP."),
  address: z.string().min(5, "Informe o endereço."),
  number: z.string().min(1, "Informe o número."),
  city: z.string().min(2, "Informe a cidade."),
  state: z.string().min(2, "Informe o estado."),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
