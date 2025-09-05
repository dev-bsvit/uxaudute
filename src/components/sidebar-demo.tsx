"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconHome,
  IconFolder,
  IconChartBar,
  IconLogout,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { signOut } from "@/lib/database";

interface SidebarDemoProps {
  children: React.ReactNode;
  user: User | null;
}

export function SidebarDemo({ children, user }: SidebarDemoProps) {
  const links = [
    {
      label: "Главная",
      href: "/",
      icon: (
        <IconHome className="h-5 w-5 shrink-0 text-white" />
      ),
    },
    {
      label: "Быстрый анализ",
      href: "/dashboard",
      icon: (
        <IconChartBar className="h-5 w-5 shrink-0 text-white" />
      ),
    },
    {
      label: "Мои проекты",
      href: "/projects",
      icon: (
        <IconFolder className="h-5 w-5 shrink-0 text-white" />
      ),
    },
    {
      label: "Настройки",
      href: "/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-white" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col overflow-hidden bg-gray-100 md:flex-row dark:bg-neutral-800",
        "h-screen", // Используем h-screen для полной высоты
      )}
    >
      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody className="justify-between gap-10" style={{ backgroundColor: '#6D90BA' }}>
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <>
              <Logo />
            </>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <IconLogout className="h-5 w-5 shrink-0" />
                Выйти
              </button>
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Пользователь',
                href: "#",
                icon: (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <IconUserBolt className="h-4 w-4 text-white" />
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col bg-white dark:bg-neutral-900 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      <img 
        src="/logo-mini.svg" 
        alt="UX Audit" 
        className="h-5 w-auto shrink-0"
      />
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <img 
        src="/logo-mini.svg" 
        alt="UX Audit" 
        className="h-5 w-auto shrink-0"
      />
    </Link>
  );
};
