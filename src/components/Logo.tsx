import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-8 w-8 text-primary", iconClassName)}
      >
        <path
          d="M16 4L4 28H10L12.6667 22H19.3333L22 28H28L16 4ZM13.75 18L16 12.5L18.25 18H13.75Z"
          fill="currentColor"
        />
      </svg>
      {showText && (
        <span
          className={cn(
            "text-xl font-bold text-foreground",
            textClassName
          )}
        >
          AVERzO
        </span>
      )}
    </div>
  );
}
