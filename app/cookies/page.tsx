import type { Metadata } from "next";

import { getLegalInfo } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Informações sobre cookies e tecnologias semelhantes.",
};

export default function CookiesPage() {
  const legal = getLegalInfo();

  return (
    <div className="container-shell py-12">
      <article className="mx-auto grid max-w-4xl gap-8">
        <header className="border-b-2 border-foreground pb-6">
          <p className="text-sm font-bold uppercase text-primary">LGPD</p>
          <h1 className="mt-2 text-4xl font-black">Política de Cookies</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: {legal.updatedAt}
          </p>
        </header>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">O que são cookies</h2>
          <p className="leading-7 text-muted-foreground">
            Cookies são pequenos arquivos ou identificadores usados para manter
            recursos da loja funcionando, lembrar preferências e, se autorizado,
            medir desempenho ou melhorar campanhas.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Tipos usados</h2>
          <ul className="grid gap-2 leading-7 text-muted-foreground">
            <li>Essenciais: login, segurança, carrinho e sessão da compra.</li>
            <li>Preferências: escolha de cookies e ajustes simples da experiência.</li>
            <li>Estatística ou marketing: somente quando configurados e aceitos pelo usuário.</li>
          </ul>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Como controlar</h2>
          <p className="leading-7 text-muted-foreground">
            Você pode aceitar todos os cookies ou manter apenas os necessários no
            banner exibido no site. Também pode apagar cookies e dados locais nas
            configurações do navegador. Cookies essenciais podem ser necessários
            para login, carrinho e checkout.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Contato</h2>
          <p className="leading-7 text-muted-foreground">
            Para dúvidas ou pedidos sobre dados pessoais, fale com o encarregado:
            {" "}
            <a className="font-bold text-foreground underline" href={`mailto:${legal.dpoEmail}`}>
              {legal.dpoEmail}
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
