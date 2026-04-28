"use client";

import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  iconBg: string;
  loading?: boolean;
  tooltip?: ReactNode;
  emphasis?: boolean;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  loading = false,
  tooltip,
  emphasis = false,
  onClick,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  const card = (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2 transition-shadow hover:shadow-md",
        onClick ? "cursor-pointer" : "cursor-default",
        emphasis && "border-indigo-200 bg-indigo-50/40"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-light text-gray-500">{title}</span>
        <div className={cn("p-2.5 rounded-xl", iconBg)}>{icon}</div>
      </div>
      <span className="text-2xl font-bold text-gray-800 tracking-tight">{value}</span>
      {subtitle && <span className="text-xs font-light text-gray-400">{subtitle}</span>}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{card}</TooltipTrigger>
          <TooltipContent side="bottom" className="p-3 max-w-56 text-right" dir="rtl">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return card;
}
