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
    <div className="grid min-h-[calc(100dvh-5rem)] bg-background md:grid-cols-2">
      <div className="flex w-full flex-col justify-center px-6 py-8 sm:px-10 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <LoginForm redirectPath={safeRedirectPath(params.next)} />
        </div>
      </div>
      <div className="relative hidden min-h-[420px] overflow-hidden bg-foreground md:block md:h-[calc(100dvh-10rem)] md:self-start">
        <Image
          src={loginImage.url}
          alt="VK Store"
          fill
          sizes="50vw"
          className={`object-contain p-8 opacity-90 lg:p-12 ${
            loginImage.grayscale ?? true ? "grayscale" : ""
          }`}
          unoptimized
          priority
        />
        <div className="absolute inset-x-0 bottom-0 bg-foreground/95 px-8 py-6 text-background lg:px-10">
          <p className="font-graffiti text-[clamp(3.5rem,7vw,6rem)] leading-none">
            VK Store
          </p>
        </div>
      </div>
    </div>
  );
}
