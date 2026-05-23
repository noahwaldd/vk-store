import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LoginForm } from "@/components/LoginForm";
import { getLoginImageSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse sua conta VK Store.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

function safeRedirectPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const loginImage = await getLoginImageSetting();

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-3 py-3 sm:px-6 sm:py-6">
      <div className="grid min-h-[calc(100dvh-1.5rem)] w-full max-w-7xl items-stretch border-2 border-foreground bg-background sm:min-h-[calc(100dvh-3rem)] md:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <div className="flex min-w-0 flex-col justify-center px-5 py-6 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-sm font-black uppercase text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Voltar para loja
            </Link>
            <LoginForm redirectPath={safeRedirectPath(params.next)} />
          </div>
        </div>
        <div className="relative hidden min-h-full overflow-hidden border-l-2 border-foreground bg-foreground md:block">
          <Image
            src={loginImage.url}
            alt="VK Store"
            fill
            sizes="(min-width: 1280px) 52vw, 50vw"
            className={`object-cover object-center opacity-95 ${
              loginImage.grayscale ?? true ? "grayscale" : ""
            }`}
            unoptimized
            priority
          />
        </div>
      </div>
    </div>
  );
}
