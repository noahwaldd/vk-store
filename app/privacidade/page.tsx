import type { Metadata } from "next";
import Link from "next/link";

import { getLegalInfo } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Informações sobre tratamento de dados pessoais na loja.",
};

export default function PrivacyPage() {
  const legal = getLegalInfo();

  return (
    <div className="container-shell py-12">
      <article className="mx-auto grid max-w-4xl gap-8">
        <header className="border-b-2 border-foreground pb-6">
          <p className="text-sm font-bold uppercase text-primary">LGPD</p>
          <h1 className="mt-2 text-4xl font-black">Política de Privacidade</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: {legal.updatedAt}
          </p>
        </header>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Controlador</h2>
          <p className="leading-7 text-muted-foreground">
            {legal.legalName} ({legal.legalDocument}) é responsável pelas
            decisões sobre o uso dos dados pessoais nesta loja. O canal do
            encarregado de dados é{" "}
            <a className="font-bold text-foreground underline" href={`mailto:${legal.dpoEmail}`}>
              {legal.dpoEmail}
            </a>
            .
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Dados tratados</h2>
          <p className="leading-7 text-muted-foreground">
            Podemos tratar nome, e-mail, telefone, endereço informado, dados de conta,
            histórico de pedidos, itens do carrinho, registros de acesso, preferências
            de cookies e informações necessárias para pedidos pelo WhatsApp, atendimento
            e segurança.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Finalidades</h2>
          <ul className="grid gap-2 leading-7 text-muted-foreground">
            <li>Processar pedidos, atendimento, trocas e reembolsos.</li>
            <li>Criar e proteger a conta do cliente.</li>
            <li>Responder atendimento por e-mail, telefone ou WhatsApp.</li>
            <li>Cumprir obrigações legais, fiscais e regulatórias.</li>
            <li>Prevenir fraude, abuso, acesso indevido e incidentes de segurança.</li>
            <li>Melhorar a experiência da loja quando houver permissão para cookies opcionais.</li>
          </ul>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Bases legais</h2>
          <p className="leading-7 text-muted-foreground">
            O tratamento pode ocorrer para execução de contrato, cumprimento de
            obrigação legal ou regulatória, exercício regular de direitos,
            legítimo interesse em segurança e melhoria da loja, e consentimento
            quando a LGPD exigir uma autorização específica.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Compartilhamento</h2>
          <p className="leading-7 text-muted-foreground">
            Dados podem ser compartilhados com operadores necessários para a
            loja funcionar, como hospedagem, banco de dados, armazenamento de
            imagens, ferramentas de autenticação, atendimento, WhatsApp e
            autoridades quando exigido por lei.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Retenção e segurança</h2>
          <p className="leading-7 text-muted-foreground">
            Mantemos dados pelo tempo necessário para cumprir as finalidades
            informadas, obrigações legais e defesa em processos. Usamos controles
            de acesso, senhas com hash, conexões protegidas e armazenamento
            restrito, mas nenhum sistema é totalmente imune a riscos.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Direitos do titular</h2>
          <p className="leading-7 text-muted-foreground">
            O titular pode pedir confirmação de tratamento, acesso, correção,
            anonimização, bloqueio, eliminação, portabilidade, informações sobre
            compartilhamento, revisão de decisões automatizadas, revogação de
            consentimento e oposição quando aplicável. Solicite pelo e-mail do
            encarregado informado nesta página.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-3xl uppercase leading-none">Cookies</h2>
          <p className="leading-7 text-muted-foreground">
            Veja detalhes na{" "}
            <Link href="/cookies" className="font-bold text-foreground underline">
              Política de Cookies
            </Link>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
