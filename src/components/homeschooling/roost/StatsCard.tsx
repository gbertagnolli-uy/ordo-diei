"use client";

// Portado de vendor/roost/src/components/admin/StatsCard.tsx (msrbuilds/roost@492af47).
// Cambios: sobre Card de ui/, colores por tokens (sin paleta blue/purple/…), sin variantes de modo oscuro.

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type Color = "primary" | "success" | "warning" | "error";

const COLORES: Record<Color, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "primary",
  children,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string; isPositive?: boolean };
  color?: Color;
  children?: ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {typeof value === "number" ? value.toLocaleString("es") : value}
          </p>
          {trend && (
            <p className="mt-2 text-sm">
              <span className={`font-medium ${trend.isPositive ? "text-success" : "text-destructive"}`}>
                {trend.isPositive ? "+" : ""}
                {trend.value}
              </span>
              <span className="ml-1 text-muted-foreground">{trend.label}</span>
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${COLORES[color]}`}>
          <Icon className="size-6" />
        </div>
      </div>
      {children}
    </Card>
  );
}
