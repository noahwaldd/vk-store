export function formatOrderReference(orderId: string) {
  const compactId = orderId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();

  return compactId ? `VK-${compactId}` : "VK-PEDIDO";
}
