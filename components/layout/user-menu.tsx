"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/services/auth.actions";
import type { SessionProfile } from "@/types/auth";
import { getInitials, getRoleLabel } from "@/lib/utils";

interface UserMenuProps {
  user: SessionProfile;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isLoggingOut, startTransition] = React.useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      toast.info("Anda telah keluar dari akun.");
      window.location.href = "/";
    });
  };

  const displayName = user.displayName || user.username;
  const initials = getInitials(displayName);
  const roleLabel = getRoleLabel(user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 p-0.5 transition-opacity hover:opacity-90">
        <Avatar className="size-9 border border-border shadow-xs">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
              <Shield className="size-3 text-primary" />
              <span>{roleLabel}</span>
              <span className="text-[10px] opacity-70">(@{user.username})</span>
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/ganti-password" className="cursor-pointer">
              <KeyRound className="mr-2 size-4" />
              <span>Ganti Password</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 size-4" />
          <span>{isLoggingOut ? "Keluar..." : "Keluar Sesi"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
