"use client";
import React, { useState, useEffect } from "react";
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
  IconCreditCard,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { signOut } from "@/lib/database";
import { supabase } from "@/lib/supabase";

interface SidebarDemoProps {
  children: React.ReactNode;
  user: User | null;
}

export function SidebarDemo({ children, user }: SidebarDemoProps) {
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);

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
      label: "Счет",
      href: "/credits",
      icon: (
        <IconCreditCard className="h-5 w-5 shrink-0 text-white" />
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

  const [open, setOpen] = useState(true);

  // Загружаем баланс кредитов
  useEffect(() => {
    const fetchCreditsBalance = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/credits/balance', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setCreditsBalance(data.balance);
        }
      } catch (error) {
        console.error('Error fetching credits balance:', error);
      }
    };

    if (user) {
      fetchCreditsBalance();
    }
  }, [user]);

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
        "flex w-full flex-1 flex-col overflow-hidden md:flex-row",
        "h-screen", // Используем h-screen для полной высоты
      )}
      style={{ backgroundColor: '#6D90BA' }}
    >
      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="justify-between gap-10" style={{ backgroundColor: '#6D90BA' }}>
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <>
              <Logo />
            </>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              
              {/* Баланс кредитов */}
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">Баланс кредитов</span>
                  <span className="text-lg font-bold text-white">
                    {creditsBalance !== null ? creditsBalance : '...'}
                  </span>
                </div>
              </div>
              
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
        <div className="flex h-full w-full flex-1 flex-col bg-white dark:bg-neutral-900 overflow-y-auto ml-4 mr-0 mt-0 mb-4 rounded-tl-3xl rounded-bl-3xl">
          <div className="p-8 h-full">
            {children}
          </div>
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
        src="/logo.svg" 
        alt="UX Audit" 
        className="h-6 w-auto shrink-0"
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
