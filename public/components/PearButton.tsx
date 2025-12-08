import { Button } from "@/components/ui/button";

interface PearButtonProps {
  text: string;
  onClick?: () => void;
  dark?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "sm" | "default" | "lg" | "icon" | "icon-sm" | "icon-lg";
  disabled?: boolean;
}

export default function PearButton({
  text,
  onClick,
  dark,
  className,
  variant,
  size,
  disabled,
}: PearButtonProps) {
  const resolvedVariant = variant ?? (dark ? "secondary" : "default");
  const resolvedSize = size ?? "default";

  return (
    <Button
      variant={resolvedVariant}
      size={resolvedSize}
      onClick={onClick}
      disabled={!!disabled}
      className={`font-semibold cursor-pointer hover:scale-105 hover:shadow-lg ${className || ""}`}
    >
      {text}
    </Button>
  );
}
