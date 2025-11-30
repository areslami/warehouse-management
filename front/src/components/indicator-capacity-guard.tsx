"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Indicator } from "@/lib/interfaces/core";

type IndicatorCapacityGuardProps = {
  indicator?: Indicator | null;
};

export const IndicatorCapacityGuard = ({
  indicator,
}: IndicatorCapacityGuardProps) => {
  const tCommon = useTranslations("common");

  const isCounterExhausted =
    !!indicator &&
    typeof indicator.counter === "number" &&
    typeof indicator.end_number === "number" &&
    indicator.counter >= indicator.end_number;

  if (!isCounterExhausted) return null;

  return (
    <Dialog open dir="rtl" onOpenChange={() => {}}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-md text-right [&>button]:hidden"
      >
        <DialogHeader dir="rtl" className="text-right space-y-1 items-end">
          <DialogTitle dir="rtl" className="text-red-600 w-full text-right">
            {tCommon("indicator_limit.title")}
          </DialogTitle>
          <DialogDescription
            dir="rtl"
            className="leading-relaxed text-muted-foreground text-right"
          >
            {tCommon("indicator_limit.message")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-2">
          <Button asChild>
            <Link href="/settings">{tCommon("indicator_limit.cta")}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
