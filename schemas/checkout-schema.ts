import { z } from "zod";

import { checkoutProfileSchema } from "@/schemas/checkout-profile-schema";

export const checkoutSchema = checkoutProfileSchema.extend({
  acceptPrivacy: z.boolean().optional(),
  saveCustomerProfile: z.boolean().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
