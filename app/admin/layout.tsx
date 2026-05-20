import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { getCurrentUser, isAdminUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdminUser(user)) {
    return (
      <div className="container-shell grid min-h-[70vh] place-items-center py-10">
        <div className="w-full max-w-xl border-2 border-foreground bg-background p-8">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Acesso bloqueado
          </p>
          <h1 className="mt-3 font-graffiti text-5xl leading-none">
            Conta sem permissão
          </h1>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Esta conta não tem permissão para continuar nesta área.
          </p>
          <Button asChild className="mt-6 rounded-none">
            <Link href="/login?next=/admin">Entrar com outra conta</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell grid gap-6 py-10 lg:grid-cols-[auto_minmax(0,1fr)]">
      <AdminSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
