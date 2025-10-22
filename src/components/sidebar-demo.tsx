"use client";

import type {
  ComponentType,
  Dispatch,
  MouseEvent,
  ReactNode,
  SetStateAction,
  SVGProps,
} from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarBody,
  useSidebar,
} from "./ui/sidebar";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  FolderClosed,
  Globe,
  Home,
  LogOut,
  Plus,
  Settings2,
  Star,
  FileText,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { signOut } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/use-translation-safe";
import { useLanguage } from "@/hooks/use-language";

interface SidebarDemoProps {
  children: ReactNode;
  user: User | null;
}

export function SidebarDemo({ children, user }: SidebarDemoProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tWithFallback } = useTranslation();
  const { currentLanguage, availableLanguages, switchLanguage } = useLanguage();

  const [open, setOpen] = useState(true);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);

  useEffect(() => {
    const fetchCreditsBalance = async () => {
      if (!user) return;

      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        if (!token) return;

        const response = await fetch("/api/credits/balance", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setCreditsBalance(data.balance);
        }
      } catch (error) {
        console.error("Error fetching credits balance:", error);
      }
    };

    fetchCreditsBalance();
  }, [user]);

  useEffect(() => {
    if (!open) {
      setLanguagePickerOpen(false);
    }
  }, [open]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/home") {
      return pathname === "/home" || pathname === "/";
    }
    if (href === "/projects") {
      return pathname.startsWith("/projects");
    }
    if (href === "/surveys") {
      return pathname.startsWith("/surveys") || pathname.includes("/public/survey/");
    }
    return pathname.startsWith(href);
  };

  const primaryNav = useMemo(
    () => [
      {
        key: "home",
        label: tWithFallback("components.sidebar.home", "Home"),
        href: "/home",
        icon: Home,
      },
      {
        key: "projects",
        label: tWithFallback("components.sidebar.myProjects", "My Projects"),
        href: "/projects",
        icon: FolderClosed,
      },
      {
        key: "surveys",
        label: tWithFallback("components.sidebar.surveys", "Surveys"),
        href: "/surveys",
        icon: FileText,
      },
    ],
    [tWithFallback]
  );

  const secondaryNav = useMemo(
    () => [
      {
        key: "credits",
        label: tWithFallback("components.sidebar.credits", "Credits"),
        href: "/credits",
        icon: Star,
      },
      {
        key: "settings",
        label: tWithFallback("components.sidebar.settings", "Settings"),
        href: "/settings",
        icon: Settings2,
      },
    ],
    [tWithFallback]
  );

  const handleCreateProjectShortcut = (
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    router.push("/projects?create=1");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const createProjectLabel = tWithFallback(
    "components.sidebar.createProject",
    "Create project"
  );

  const userFallbackLabel = tWithFallback(
    "components.sidebar.user",
    "User"
  );

  return (
    <div className="flex min-h-screen w-full bg-gray-50 md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="border-r border-gray-200 bg-white">
          <SidebarContent
            primaryNav={primaryNav}
            secondaryNav={secondaryNav}
            isActive={isActive}
            handleCreateProjectShortcut={handleCreateProjectShortcut}
            createProjectLabel={createProjectLabel}
            creditsBalance={creditsBalance}
            languagePickerOpen={languagePickerOpen}
            setLanguagePickerOpen={setLanguagePickerOpen}
            currentLanguage={currentLanguage}
            availableLanguages={availableLanguages}
            switchLanguage={switchLanguage}
            handleLogout={handleLogout}
            user={user}
            userFallbackLabel={userFallbackLabel}
            languageLabel={tWithFallback(
              "components.sidebar.language",
              "Language"
            )}
            logoutLabel={tWithFallback("navigation.logout", "Log out")}
          />
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-white">
          <div className="h-full py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

const SidebarBrand = () => {
  const { open } = useSidebar();

  return (
    <div
      className={cn(
        "flex items-center px-3 py-4",
        open ? "justify-start" : "justify-center"
      )}
    >
      {open ? <Logo /> : <LogoIcon />}
    </div>
  );
};

type NavItemDefinition = {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

interface SidebarContentProps {
  primaryNav: NavItemDefinition[];
  secondaryNav: NavItemDefinition[];
  isActive: (href: string) => boolean;
  handleCreateProjectShortcut: (event: MouseEvent<HTMLButtonElement>) => void;
  createProjectLabel: string;
  creditsBalance: number | null;
  languagePickerOpen: boolean;
  setLanguagePickerOpen: Dispatch<SetStateAction<boolean>>;
  currentLanguage: string;
  availableLanguages: { code: string; name: string; nativeName: string }[];
  switchLanguage: (language: string) => Promise<{ success: boolean }>;
  handleLogout: () => void;
  user: User | null;
  userFallbackLabel: string;
  languageLabel: string;
  logoutLabel: string;
}

const SidebarContent = ({
  primaryNav,
  secondaryNav,
  isActive,
  handleCreateProjectShortcut,
  createProjectLabel,
  creditsBalance,
  languagePickerOpen,
  setLanguagePickerOpen,
  currentLanguage,
  availableLanguages,
  switchLanguage,
  handleLogout,
  user,
  userFallbackLabel,
  languageLabel,
  logoutLabel,
}: SidebarContentProps) => {
  return (
    <div className="flex h-full flex-col">
      <SidebarBrand />

      <div className="mt-6 flex-1 overflow-hidden px-3">
        <div className="flex h-full flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <nav className="flex flex-col gap-2">
            {primaryNav.map((item) => (
              <SidebarItem
                key={item.key}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
                trailing={
                  item.key === "projects" ? (
                    <QuickAddButton
                      onClick={handleCreateProjectShortcut}
                      ariaLabel={createProjectLabel}
                    />
                  ) : undefined
                }
              />
            ))}
          </nav>

          <div className="h-px bg-gray-200" />

          <nav className="flex flex-col gap-2">
            {secondaryNav.map((item) => (
              <SidebarItem
                key={item.key}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
                badge={
                  item.key === "credits"
                    ? (
                        <SidebarBadge>
                          {creditsBalance !== null ? creditsBalance : "..."}
                        </SidebarBadge>
                      )
                    : undefined
                }
              />
            ))}

            <LanguageSidebarItem
              label={languageLabel}
              currentLanguage={currentLanguage}
              availableLanguages={availableLanguages}
              onLanguageChange={switchLanguage}
              isExpanded={languagePickerOpen}
              onToggle={() => setLanguagePickerOpen((value) => !value)}
              onClose={() => setLanguagePickerOpen(false)}
            />

            <SidebarItem icon={LogOut} label={logoutLabel} onClick={handleLogout} />
          </nav>
        </div>
      </div>

      <div className="mt-auto border-t border-gray-200 p-3">
        <UserSummary user={user} fallbackLabel={userFallbackLabel} />
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  trailing?: ReactNode;
  badge?: ReactNode;
}

interface SidebarItemContentProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  active?: boolean;
  trailing?: ReactNode;
  badge?: ReactNode;
  open: boolean;
}

const SidebarItemContent = ({
  icon: Icon,
  label,
  active = false,
  trailing,
  badge,
  open,
}: SidebarItemContentProps) => {
  return (
    <div
      className={cn(
        "relative flex items-center rounded-xl text-sm transition-all",
        open ? "h-12 w-full px-3" : "h-12 w-12 justify-center px-0",
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors flex-shrink-0",
          active ? "text-blue-700" : "text-gray-600"
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>

      {open && (
        <div className="ml-3 flex min-w-0 flex-1 items-center gap-3">
          <span className="truncate font-medium leading-none">
            {label}
          </span>
          {trailing || badge ? (
            <div className="ml-auto flex items-center gap-2">
              {badge}
              {trailing}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  active = false,
  onClick,
  trailing,
  badge,
}: SidebarItemProps) => {
  const { open } = useSidebar();
  const content = (
    <SidebarItemContent
      icon={Icon}
      label={label}
      active={active}
      trailing={trailing}
      badge={badge}
      open={open}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(open ? "block w-full" : "flex w-full justify-center")}
        onClick={(event) => onClick?.(event)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => onClick?.(event)}
      className={cn(open ? "w-full" : "flex w-full justify-center")}
    >
      {content}
    </button>
  );
};

interface LanguageSidebarItemProps {
  label: string;
  currentLanguage: string;
  availableLanguages: { code: string; name: string; nativeName: string }[];
  onLanguageChange: (language: string) => Promise<{ success: boolean }>;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const LanguageSidebarItem = ({
  label,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  isExpanded,
  onToggle,
  onClose,
}: LanguageSidebarItemProps) => {
  const { open } = useSidebar();

  const handleChange = async (language: string) => {
    if (language === currentLanguage) {
      onClose();
      return;
    }
    await onLanguageChange(language);
    onClose();
  };

  // Карта языков для коротких названий
  const languageShortNames: Record<string, string> = {
    'en': 'Eng',
    'ru': 'Рус',
    'ua': 'Укр',
    'uk': 'Укр'
  };

  const shortName = languageShortNames[currentLanguage.toLowerCase()] || currentLanguage.toUpperCase();

  return (
    <div>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
        className="w-full"
        aria-expanded={open && isExpanded}
      >
        <SidebarItemContent
          icon={Globe}
          label={shortName}
          trailing={
            open ? (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-500 transition-transform",
                  isExpanded ? "rotate-180" : "rotate-0"
                )}
              />
            ) : null
          }
          open={open}
        />
      </button>

      {open && isExpanded ? (
        <div className="mt-2 space-y-1 pl-12 pr-2">
          {availableLanguages.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => handleChange(language.code)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                language.code === currentLanguage
                  ? "bg-[#EEF2FF] text-[#1D1D26]"
                  : "text-[#6F6F7A] hover:bg-white hover:text-[#121217]"
              )}
            >
              <span className="block font-medium leading-none">
                {language.nativeName}
              </span>
              <span className="text-xs uppercase text-[#A0A0AA]">
                {language.code}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface QuickAddButtonProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
}

const QuickAddButton = ({ onClick, ariaLabel }: QuickAddButtonProps) => {
  const { open } = useSidebar();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-[#EEF2FF] text-[#4F46E5] transition-colors hover:bg-[#E0E7FF]",
        !open && "hidden"
      )}
      aria-label={ariaLabel}
    >
      <Plus className="h-4 w-4" strokeWidth={2} />
    </button>
  );
};

const SidebarBadge = ({ children }: { children: ReactNode }) => {
  return (
    <span className="flex min-w-[32px] items-center justify-center rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
      {children}
    </span>
  );
};

const UserSummary = ({
  user,
  fallbackLabel,
}: {
  user: User | null;
  fallbackLabel: string;
}) => {
  const { open } = useSidebar();
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    fallbackLabel;

  if (!user) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl transition-all",
        open ? "px-2 py-2" : "h-12 w-12 justify-center p-0"
      )}
    >
      <div className="flex h-9 w-9 min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white">
        {displayName.slice(0, 2).toUpperCase()}
      </div>
      {open && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {displayName}
          </p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>
      )}
    </div>
  );
};

export const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      <img src="/Logo-b.svg" alt="UX Audit" className="h-6 w-auto shrink-0" />
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex h-12 w-12 items-center justify-center rounded-xl text-sm font-normal text-black"
    >
      <img src="/Logo-mini-b.svg" alt="UX Audit" className="h-8 w-auto shrink-0" />
    </Link>
  );
};
