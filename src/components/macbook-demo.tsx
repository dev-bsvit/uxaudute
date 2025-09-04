import React from "react";
import { MacbookScroll } from "@/components/ui/macbook-scroll";

export function MacbookScrollDemo() {
  return (
    <div className="w-full overflow-hidden bg-white dark:bg-[#0B0B0F]">
      <MacbookScroll
        key={`macbook-${Date.now()}`}
        title={
          <span>
            Профессиональный UX Анализ <br /> с помощью GPT-4
          </span>
        }
        badge={
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
            <span className="text-white font-bold text-lg">🎯</span>
          </div>
        }
        src={`/ux-demo.svg?v=${Date.now()}`}
        showGradient={false}
      />
    </div>
  );
}

// UX Audit Badge
const Badge = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full ${className}`}>
      <span className="text-white font-bold text-lg">🎯</span>
    </div>
  );
};
