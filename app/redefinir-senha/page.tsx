import type { Metadata } from "next";
import Image from "next/image";

import { PasswordResetForm } from "@/components/PasswordResetForm";
import { getLoginImageSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Redefinir senha",
  description: "Crie uma nova senha para sua conta VK Store.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const [params, loginImage] = await Promise.all([
    searchParams,
    getLoginImageSetting(),
  ]);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] bg-background md:grid-cols-2">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <PasswordResetForm token={params.token} />
        </div>
      </div>
      <div className="relative hidden min-h-[620px] overflow-hidden bg-foreground md:block">
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
