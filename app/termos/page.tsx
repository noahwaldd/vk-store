import type { Metadata } from "next";
import Link from "next/link";

import { getLegalInfo } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Condições de uso da loja.",
};

export default function TermsPage() {
  const legal = getLegalInfo();

  return (
    <div className="container-shell py-12">
      <article className="mx-auto grid max-w-4xl gap-8">
        <header className="border-b-2 border-foreground pb-6">
          <p className="text-sm font-bold uppercase text-primary">Loja</p>
          <h1 className="mt-2 text-4xl font-black">Termos de Uso</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: {legal.updatedAt}
          </p>
        </header>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Identificação</h2>
          <p className="leading-7 text-muted-foreground">
            Esta loja é operada por {legal.legalName} ({legal.legalDocument}).
            Atendimento:{" "}
            <a className="font-bold text-foreground underline" href={`mailto:${legal.supportEmail}`}>
              {legal.supportEmail}
            </a>
            .
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Pedidos e pagamento</h2>
          <p className="leading-7 text-muted-foreground">
            Ao finalizar uma compra, o cliente confirma que os dados informados
            estão corretos. O pedido é enviado pelo WhatsApp da loja, onde serão
            confirmados disponibilidade, retirada e forma de pagamento.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Estoque e atendimento</h2>
          <p className="leading-7 text-muted-foreground">
            Produtos, preços e estoque podem ser atualizados. Retirada, troca e
            devolução devem ser confirmadas pelo atendimento da loja e pelas regras
            comerciais divulgadas ao cliente.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Dados pessoais</h2>
          <p className="leading-7 text-muted-foreground">
            O uso de dados pessoais segue a{" "}
            <Link href="/privacidade" className="font-bold text-foreground underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
