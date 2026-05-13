import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import type { StudyRoomViewModel } from "../hooks/use-study-rooms";

interface ChatMessage {
  id: string;
  sender: string;
  initials: string;
  text: string;
  time: string;
}

interface StudyRoomChatProps {
  room: StudyRoomViewModel;
}

function chatStorageKey(roomId: string): string {
  return `studyroom.room-chat.v1:${roomId}`;
}

function loadPersistedChat(roomId: string): { messages: ChatMessage[]; draft: string } {
  try {
    const raw = window.localStorage.getItem(chatStorageKey(roomId));
    if (!raw) return { messages: [], draft: "" };
    const parsed = JSON.parse(raw) as { messages?: unknown; draft?: unknown };
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.filter(
          (m): m is ChatMessage =>
            Boolean(m) &&
            typeof (m as ChatMessage).id === "string" &&
            typeof (m as ChatMessage).sender === "string" &&
            typeof (m as ChatMessage).initials === "string" &&
            typeof (m as ChatMessage).text === "string" &&
            typeof (m as ChatMessage).time === "string",
        )
      : [];
    const draft = typeof parsed.draft === "string" ? parsed.draft : "";
    return { messages, draft };
  } catch {
    return { messages: [], draft: "" };
  }
}

function persistChat(roomId: string, messages: ChatMessage[], draft: string) {
  try {
    window.localStorage.setItem(chatStorageKey(roomId), JSON.stringify({ messages, draft }));
  } catch {
    /* ignore quota / private mode */
  }
}

export function StudyRoomChat({ room }: StudyRoomChatProps) {
  const { session } = useAuth();
  const roomId = room.id;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    const next = loadPersistedChat(roomId);
    setMessages(next.messages);
    setDraft(next.draft);
  }, [roomId]);

  const myName = session?.user?.name ?? "You";
  const myInitials = useMemo(
    () =>
      myName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase() ?? "")
        .join("") || "H",
    [myName],
  );

  const sendMessage = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const newMsg: ChatMessage = {
      id: `${Date.now()}`,
      sender: myName,
      initials: myInitials,
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => {
      const next = [...prev, newMsg];
      persistChat(roomId, next, "");
      return next;
    });
    setDraft("");
  }, [draft, myInitials, myName, roomId]);

  const onDraftChange = (value: string) => {
    setDraft(value);
    persistChat(roomId, messagesRef.current, value);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-border/60 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Live chat for <span className="font-semibold text-foreground">{room.name}</span> — local
          only until real-time is wired. Drafts and messages persist in this browser until you clear
          site data.
        </p>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation.
            </div>
          ) : null}
          {messages.map((msg) => {
            const isMe = msg.sender === myName;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex items-start gap-2.5", isMe && "flex-row-reverse")}
                data-testid={`message-${msg.id}`}
              >
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="bg-primary/20 text-[9px] font-bold text-primary">
                    {msg.initials}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("max-w-xs", isMe && "flex flex-col items-end")}>
                  <div className="mb-0.5 flex items-center gap-2">
                    {!isMe && <span className="text-[10px] font-semibold">{msg.sender}</span>}
                    <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs",
                      isMe ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex gap-2 border-t border-border/60 p-3">
        <Input
          placeholder={`Message ${room.name}...`}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && sendMessage()}
          className="text-sm"
          data-testid="input-message"
        />
        <Button size="icon" onClick={sendMessage} data-testid="button-send-message">
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
}
