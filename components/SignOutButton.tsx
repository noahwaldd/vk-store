"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-11 rounded-none"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut />
      Sair
    </Button>
  );
}
