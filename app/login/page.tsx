import type { Metadata } from "next";
import Image from "next/image";

import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse sua conta na VK Store.",
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

  return (
    <div className="grid min-h-[calc(100vh-4rem)] bg-background md:grid-cols-2">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <LoginForm redirectPath={safeRedirectPath(params.next)} />
        </div>
      </div>
      <div className="relative hidden min-h-[620px] overflow-hidden bg-foreground md:block">
        <Image
          src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1400&q=85"
          alt="Editorial streetwear VK Store"
          fill
          sizes="50vw"
          className="object-cover opacity-90 grayscale"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 bg-foreground px-10 py-8 text-background">
          <p className="font-display text-lg uppercase tracking-[0.35em] text-background/70">
            Badaboom / Urban Jungle
          </p>
          <p className="mt-3 font-graffiti text-7xl leading-[0.85]">VK Store</p>
        </div>
      </div>
    </div>
  );
}
