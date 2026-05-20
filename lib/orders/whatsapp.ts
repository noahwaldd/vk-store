import "server-only";

import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types/order";

type WhatsAppOrderInput = {
  orderId: string;
  items: CartItem[];
  total: number;
  couponCode?: string | null;
  couponDiscount?: number | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    document?: string;
  };
  delivery: {
    cep?: string;
    address?: string;
    number?: string;
    city?: string;
    state?: string;
  };
};

function getStoreUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    "https://lojavkstore.com.br"
  );
}

export function getWhatsAppNumber() {
  const configuredNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

  return configuredNumber || "556292338635";
}

function formatOrderItem(item: CartItem) {
  const variation = item.variation ? ` (${item.variation})` : "";
  const subtotal = item.product.price * item.quantity;

  return `- ${item.product.name}${variation} | Qtd. ${item.quantity} | ${formatCurrency(subtotal)}`;
}

function buildWhatsAppOrderMessage(input: WhatsAppOrderInput) {
  const addressLine = [input.delivery.address, input.delivery.number]
    .filter(Boolean)
    .join(", ");
  const cityLine = [
    input.delivery.city,
    input.delivery.state?.toUpperCase(),
  ]
    .filter(Boolean)
    .join("/");
  const cepLine = input.delivery.cep ? `CEP ${input.delivery.cep}` : null;
  const hasAddress = Boolean(addressLine || cityLine || cepLine);
  const lines = [
    "Olá, VK Store! Quero finalizar meu pedido.",
    "",
    `Pedido: ${input.orderId}`,
    `Nome: ${input.customer.name}`,
    `Telefone: ${input.customer.phone}`,
    `E-mail: ${input.customer.email}`,
    input.customer.document ? `CPF/CNPJ: ${input.customer.document}` : null,
    "",
    "Itens:",
    ...input.items.map(formatOrderItem),
    "",
    input.couponCode && input.couponDiscount
      ? `Cupom: ${input.couponCode} (-${formatCurrency(input.couponDiscount)})`
      : null,
    `Total do pedido: ${formatCurrency(input.total)}`,
    "",
    hasAddress ? "Endereço informado:" : null,
    addressLine || null,
    [cityLine, cepLine].filter(Boolean).join(" - ") || null,
    "",
    `Loja: ${getStoreUrl()}`,
    "Por favor, confirme disponibilidade, retirada e forma de pagamento.",
  ];

  return lines.filter(Boolean).join("\n");
}

export function buildWhatsAppOrderUrl(input: WhatsAppOrderInput) {
  const message = buildWhatsAppOrderMessage(input);
  const number = getWhatsAppNumber();

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
