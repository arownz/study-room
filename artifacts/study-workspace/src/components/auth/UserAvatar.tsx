import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/features/profile";

interface UserAvatarProps {
  name?: string | null;
  src?: string | null;
  className?: string;
  fallbackClassName?: string;
  fallbackText?: string;
}

export function UserAvatar({
  name,
  src,
  className,
  fallbackClassName,
  fallbackText,
}: UserAvatarProps) {
  const initials = fallbackText ?? getInitials(name, "H");
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {src ? <AvatarImage src={src} alt={name ?? "User avatar"} /> : null}
      <AvatarFallback
        className={cn(
          "bg-primary text-primary-foreground text-xs font-bold",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
