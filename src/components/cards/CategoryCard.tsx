import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type CategoryCardProps = {
  category: {
    name: string;
    href: string;
    icon: LucideIcon;
  };
  colorClass: string;
};

export function CategoryCard({ category, colorClass }: CategoryCardProps) {
  return (
    <Link href={category.href} className="group block h-full">
      <div
        className={cn(
          "flex h-full items-center justify-between p-4 rounded-xl",
          colorClass
        )}
      >
        <h3 className="font-bold text-foreground text-sm md:text-base">{category.name}</h3>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
          <category.icon className="h-6 w-6 text-foreground/80" />
        </div>
      </div>
    </Link>
  );
}
