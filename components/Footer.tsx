import Image from "next/image";
import Link from "next/link";
import { Clock, Headphones, Mail, MessageCircle } from "lucide-react";

import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";

export async function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "556292338635";
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@lojavkstore.com.br";
  const [user, footerItems, secondaryItems] = await Promise.all([
    getCurrentUser(),
    getNavigationItems("footer"),
    getNavigationItems("secondary"),
  ]);
  const accountHref = user && isAdminUser(user) ? "/admin" : user ? "/conta" : "/login";
  const accountLabel = user && isAdminUser(user) ? "Painel" : user ? "Conta" : "Login";
  const navigationItems = footerItems.map((item) => {
    if (item.href === "/login") {
      return { ...item, href: accountHref, label: accountLabel };
    }

    if (item.href === "/checkout") {
      return { ...item, label: "Finalizar pedido" };
    }

    return item;
  });

  return (
    <footer className="mt-auto border-t-2 border-foreground bg-foreground text-background">
      <div className="container-shell grid gap-10 py-16 md:grid-cols-[1.25fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Image
              src="/vk-store-white.png"
              alt="VK Store"
              width={40}
              height={40}
              className="bg-foreground object-contain"
              style={{ width: "40px", height: "40px" }}
            />
            <span className="font-graffiti text-4xl tracking-widest">VK Store</span>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-background/80">
            Roupas, perfumes e acessórios com seleção direta, preço competitivo e
            atendimento rápido.
          </p>
        </div>

        <div>
          <h2 className="mb-6 font-display text-xl tracking-widest uppercase">Navegação</h2>
          <div className="grid gap-3 text-base text-background/80 font-medium">
            {navigationItems.map((item) => (
              <Link
                key={`${item.location}-${item.id}`}
                href={item.href}
                className="hover:text-background transition-colors hover:translate-x-1"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-6 font-display text-xl tracking-widest uppercase">Loja</h2>
          <div className="grid gap-3 text-base text-background/80 font-medium">
            {secondaryItems.map((item) => (
              <Link
                key={`${item.location}-${item.id}`}
                href={item.href}
                className="hover:text-background transition-colors hover:translate-x-1"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/privacidade"
              className="hover:text-background transition-colors hover:translate-x-1"
            >
              Privacidade
            </Link>
            <Link
              href="/cookies"
              className="hover:text-background transition-colors hover:translate-x-1"
            >
              Cookies
            </Link>
            <Link
              href="/termos"
              className="hover:text-background transition-colors hover:translate-x-1"
            >
              Termos de uso
            </Link>
          </div>
        </div>

        <div>
          <h2 className="mb-6 font-display text-xl tracking-widest uppercase">Atendimento</h2>
          <div className="grid gap-4 text-base text-background/80 font-medium">
            <span className="flex items-center gap-3">
              <Headphones className="size-5" />
              Seg. a sex. 10:00-20:00
            </span>
            <span className="flex items-center gap-3">
              <Clock className="size-5" />
              Sábado 10:00-18:00, domingo fechado
            </span>
            <span className="flex items-center gap-3">
              <Mail className="size-5" />
              {supportEmail}
            </span>
            <Link
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 hover:text-background transition-colors hover:translate-x-1"
            >
              <MessageCircle className="size-5" />
              WhatsApp
            </Link>
          </div>
        </div>
      </div>
      <div className="container-shell border-t-2 border-background/20 py-5 text-center text-xs text-background/70">
        <p>© 2026 VK Store. Todos os direitos reservados.</p>
        <p className="mt-2">
          Desenvolvido por <a href="#" className="font-black text-background transition-colors hover:text-street-lime">Novality</a>.
        </p>
      </div>
    </footer>
  );
}
