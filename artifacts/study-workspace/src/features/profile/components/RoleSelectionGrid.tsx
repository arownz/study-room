import { GraduationCap, Microscope, Briefcase, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { USER_ROLE_OPTIONS, type UserRole } from "../types";

const ROLE_ICONS: Record<UserRole, typeof GraduationCap> = {
  student: GraduationCap,
  teacher: BookOpen,
  researcher: Microscope,
  professional: Briefcase,
  self_learner: Sparkles,
};

interface RoleSelectionGridProps {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

export function RoleSelectionGrid({
  value,
  onChange,
  disabled,
}: RoleSelectionGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {USER_ROLE_OPTIONS.map((option) => {
        const Icon = ROLE_ICONS[option.id];
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            disabled={disabled}
            className={cn(
              "group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                : "border-border hover:border-primary/40 hover:bg-muted/30",
              disabled && "cursor-not-allowed opacity-60",
            )}
            data-testid={`role-option-${option.id}`}
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                selected
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground group-hover:text-foreground",
              )}
            >
              <Icon size={17} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="text-xs text-muted-foreground leading-snug">
                {option.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
