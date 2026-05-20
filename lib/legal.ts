export function getLegalInfo() {
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@lojavkstore.com.br";

  return {
    storeName: process.env.NEXT_PUBLIC_STORE_NAME || "VK Store",
    legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "VK Store",
    legalDocument:
      process.env.NEXT_PUBLIC_LEGAL_DOCUMENT || "CNPJ a informar",
    dpoEmail: process.env.NEXT_PUBLIC_DPO_EMAIL || supportEmail,
    supportEmail,
    updatedAt: "15/05/2026",
  };
}
