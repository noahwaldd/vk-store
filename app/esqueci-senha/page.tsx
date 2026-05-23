import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PasswordResetRequestForm } from "@/components/PasswordResetRequestForm";
import { getLoginImageSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Esqueci minha senha",
  description: "Receba um link para redefinir sua senha na VK Store.",
};

export default async function ForgotPasswordPage() {
  const loginImage = await getLoginImageSetting();

  return (
    <div className="grid min-h-dvh bg-background md:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)]">
      <div className="flex w-full flex-col justify-center px-5 py-8 sm:px-10 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-black uppercase text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para loja
          </Link>
          <PasswordResetRequestForm />
        </div>
      </div>
      <div className="relative hidden min-h-dvh overflow-hidden bg-foreground md:block">
        <Image
          src={loginImage.url}
          alt="VK Store"
          fill
          sizes="(min-width: 1280px) 54vw, 50vw"
          className={`object-cover object-center opacity-95 ${
            loginImage.grayscale ?? true ? "grayscale" : ""
          }`}
          unoptimized
          priority
        />
      </div>
    </div>
  );
}
