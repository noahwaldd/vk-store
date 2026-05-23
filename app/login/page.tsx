import type { Metadata } from "next";
import Image from "next/image";

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
    <div className="grid min-h-[calc(100dvh-5rem)] place-items-center bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl items-stretch border-2 border-foreground bg-background md:grid-cols-[minmax(0,0.96fr)_minmax(320px,1fr)]">
        <div className="flex min-w-0 flex-col justify-center px-5 py-6 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <LoginForm redirectPath={safeRedirectPath(params.next)} />
          </div>
        </div>
        <div className="relative hidden min-h-full overflow-hidden border-l-2 border-foreground bg-foreground md:block">
          <Image
            src={loginImage.url}
            alt="VK Store"
            fill
            sizes="(min-width: 1024px) 48vw, 50vw"
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
