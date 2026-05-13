import { BookOpen, Layers, FileText, ListOrdered, Brain } from "lucide-react";
import type { AppendAiMessageRequestTemplateKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const CHIPS: {
  key: AppendAiMessageRequestTemplateKey;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { key: "explain_concept", label: "Explain", icon: BookOpen },
  { key: "step_by_step", label: "Step by step", icon: ListOrdered },
  { key: "quiz_me", label: "Quiz me", icon: Layers },
  { key: "essay_outline", label: "Essay outline", icon: FileText },
  { key: "mnemonic", label: "Mnemonic", icon: Brain },
];

export function TemplateChips(props: {
  activeKey: AppendAiMessageRequestTemplateKey | null;
  onSelect: (key: AppendAiMessageRequestTemplateKey | null) => void;
}) {
  return (
    <div className="border-t border-border/60 px-4 pt-2 pb-1 flex gap-2 overflow-x-auto">
      {CHIPS.map((c) => {
        const Icon = c.icon;
        const active = props.activeKey === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => props.onSelect(active ? null : c.key)}
            className={cn(
              "shrink-0 text-[10px] px-2.5 py-1 rounded-full transition-colors flex items-center gap-1",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted",
            )}
            data-testid={`ai-template-${c.key}`}
          >
            <Icon size={9} />
            {c.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => props.onSelect(null)}
        className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1"
        data-testid="ai-template-clear"
      >
        Clear
      </button>
    </div>
  );
}
