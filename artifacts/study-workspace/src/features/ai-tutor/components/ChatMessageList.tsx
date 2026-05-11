import type { RefObject } from "react";
import { motion } from "framer-motion";
import { Sparkles, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AiMessageDto } from "@workspace/api-client-react";

export function ChatMessageList(props: {
  messages: AiMessageDto[];
  loading: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
  onCopy: (text: string) => void;
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="px-4 py-4 space-y-5 max-w-3xl mx-auto">
        {props.messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            data-testid={`chat-message-${msg.id}`}
          >
            {msg.role === "assistant" ? (
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={14} className="text-primary" />
              </div>
            ) : (
              <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                  H
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                "max-w-[75%] space-y-1",
                msg.role === "user" && "items-end flex flex-col",
              )}
            >
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-card border border-border/60"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <span style={{ whiteSpace: "pre-line" }}>{msg.content}</span>
              </div>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    type="button"
                    onClick={() => props.onCopy(msg.content)}
                    data-testid={`button-copy-message-${msg.id}`}
                  >
                    <Copy size={11} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" type="button" disabled data-testid={`button-regenerate-${msg.id}`}>
                    <RotateCcw size={11} />
                  </Button>
                  <span className="text-[9px] text-muted-foreground ml-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {props.loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles size={14} className="text-primary" />
            </div>
            <div className="bg-card border border-border/60 rounded-xl px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/60"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={props.bottomRef} />
      </div>
    </ScrollArea>
  );
}
