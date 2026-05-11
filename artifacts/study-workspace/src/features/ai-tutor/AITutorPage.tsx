import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Upload, Layers, Send } from "lucide-react";
import {
  useListAiThreads,
  useCreateAiThread,
  useListAiMessages,
  useAppendAiMessage,
  type AiTemplateKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { ChatMessageList } from "./components/ChatMessageList";
import { TemplateChips } from "./components/TemplateChips";

export default function AITutorPage() {
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [templateKey, setTemplateKey] = useState<AiTemplateKey | null>(null);

  const { data: threadsEnvelope } = useListAiThreads({ limit: 50, offset: 0 });
  const threads = threadsEnvelope?.data?.items ?? [];

  const { data: messagesEnvelope, isLoading: messagesLoading } = useListAiMessages(selectedId);
  const messages = messagesEnvelope?.data?.items ?? [];

  const createThread = useCreateAiThread();
  const appendMessage = useAppendAiMessage();

  useEffect(() => {
    if (selectedId || threads.length === 0) return;
    setSelectedId(threads[0].id);
  }, [selectedId, threads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, appendMessage.isPending]);

  const onNew = useCallback(() => {
    createThread.mutate(
      { data: {} },
      {
        onSuccess: (res) => {
          setSelectedId(res.data.id);
        },
      },
    );
  }, [createThread]);

  const sendMessage = async () => {
    if (!input.trim() || appendMessage.isPending) return;
    let threadId = selectedId;
    if (!threadId) {
      const created = await createThread.mutateAsync({ data: {} });
      threadId = created.data.id;
      setSelectedId(threadId);
    }
    const content = input.trim();
    setInput("");
    const tk = templateKey ?? undefined;
    setTemplateKey(null);
    appendMessage.mutate({
      threadId,
      data: { content, templateKey: tk },
    });
  };

  const onCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] -m-6 overflow-hidden border border-border/40 rounded-xl">
      <ConversationSidebar
        threads={threads}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNew={onNew}
        creating={createThread.isPending}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border/60 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">StudyRoom Tutor</p>
            <p className="text-[10px] text-emerald-400">Online — ready to help</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              type="button"
              data-testid="button-upload-material"
              onClick={() => toast({ title: "Upload coming soon" })}
            >
              <Upload size={12} /> Upload Material
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              type="button"
              data-testid="button-generate-quiz"
              onClick={() => {
                setTemplateKey("quiz_me");
                toast({ title: "Quiz template selected — add your topic below." });
              }}
            >
              <Layers size={12} /> Quiz Me
            </Button>
          </div>
        </div>

        <ChatMessageList
          messages={messages}
          loading={Boolean(selectedId) && (messagesLoading || appendMessage.isPending)}
          bottomRef={bottomRef}
          onCopy={onCopy}
        />

        <TemplateChips activeKey={templateKey} onSelect={setTemplateKey} />

        <div className="px-4 pb-4 pt-2">
          <div className="relative flex items-end gap-2">
            <Textarea
              placeholder="Ask anything — concepts, problems, essay help..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              className="resize-none text-sm min-h-10 max-h-32 pr-10"
              rows={1}
              data-testid="textarea-ai-input"
            />
            <Button
              size="icon"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || appendMessage.isPending}
              className="shrink-0 h-9 w-9"
              type="button"
              data-testid="button-send-ai-message"
            >
              <Send size={14} />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            AI responses are for learning guidance — always verify with your course materials.
          </p>
        </div>
      </div>
    </div>
  );
}
