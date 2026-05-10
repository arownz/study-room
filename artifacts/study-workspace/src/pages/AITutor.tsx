import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Upload, Plus, Lightbulb, BookOpen, Layers, FileText, RotateCcw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { mockAIMessages, mockSuggestedPrompts } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

type Message = { id: string; role: "user" | "assistant"; content: string; timestamp: string };

const conversationHistory = [
  { title: "Entropy & Thermodynamics", date: "Today" },
  { title: "DNA Replication Steps", date: "Yesterday" },
  { title: "Calculus — Chain Rule", date: "May 6" },
  { title: "Supply & Demand Analysis", date: "May 5" },
  { title: "French Revolution Causes", date: "May 3" },
];

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 8);
    return () => clearInterval(timer);
  }, [text]);
  return <span>{displayed}</span>;
}

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>(mockAIMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: String(Date.now()), role: "user", content: input, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1400));

    const responses = [
      "That's a great question. Let me break this down step by step.\n\nFirst, it's important to understand the foundational principles here. The key insight is that **most complex phenomena can be understood by examining their components**.\n\n1. Start with the basics — identify what you already know\n2. Look for patterns and relationships\n3. Apply the underlying principle to your specific case\n\nWould you like me to generate some practice questions on this topic, or would a visual explanation help more?",
      "Excellent question! This is one of those topics where seeing the **connection between theory and application** really unlocks understanding.\n\nHere's the core framework:\n\n- **Conceptual layer**: The abstract principle\n- **Mechanistic layer**: How it works in practice  \n- **Application layer**: Real-world examples\n\nThink of it like learning a language — grammar rules (theory) → sentence construction (mechanism) → conversation (application).\n\nI've noticed from your notes that you're studying related material. Want me to connect this to what you've already covered?",
    ];

    const aiMsg: Message = {
      id: String(Date.now() + 1),
      role: "assistant",
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] -m-6 overflow-hidden border border-border/40 rounded-xl">
      {/* History sidebar */}
      <div className="w-52 border-r border-border/60 bg-sidebar flex flex-col shrink-0">
        <div className="p-3 border-b border-border/60 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</p>
          <Button size="icon" className="h-6 w-6" data-testid="button-new-conversation">
            <Plus size={12} />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {conversationHistory.map((conv, i) => (
              <button
                key={i}
                className={cn(
                  "w-full text-left rounded-md px-2.5 py-2 transition-colors",
                  i === 0 ? "bg-sidebar-accent" : "hover:bg-muted/50"
                )}
                data-testid={`conversation-item-${i}`}
              >
                <p className="text-xs font-medium truncate">{conv.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{conv.date}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border/60 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">StudyRoom Tutor</p>
            <p className="text-[10px] text-emerald-400">Online — ready to help</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            <Button variant="outline" size="sm" className="text-xs gap-1" data-testid="button-upload-material">
              <Upload size={12} /> Upload Material
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1" data-testid="button-generate-quiz">
              <Layers size={12} /> Quiz Me
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-5 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
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
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">H</AvatarFallback>
                  </Avatar>
                )}

                <div className={cn("max-w-[75%] space-y-1", msg.role === "user" && "items-end flex flex-col")}>
                  <div className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "assistant" ? "bg-card border border-border/60" : "bg-primary text-primary-foreground"
                  )}>
                    {msg.role === "assistant" && i === messages.length - 1 && !loading ? (
                      <TypewriterText text={msg.content} />
                    ) : (
                      <span style={{ whiteSpace: "pre-line" }}>{msg.content}</span>
                    )}
                  </div>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyMessage(msg.content)} data-testid={`button-copy-message-${msg.id}`}>
                        <Copy size={11} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-regenerate-${msg.id}`}>
                        <RotateCcw size={11} />
                      </Button>
                      <span className="text-[9px] text-muted-foreground ml-1">{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
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
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Suggested prompts */}
        <div className="border-t border-border/60 px-4 pt-2 pb-1 flex gap-2 overflow-x-auto">
          {mockSuggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
              data-testid={`suggested-prompt-${prompt.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Lightbulb size={9} />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2">
          <div className="relative flex items-end gap-2">
            <Textarea
              placeholder="Ask anything — concepts, problems, essay help..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="resize-none text-sm min-h-10 max-h-32 pr-10"
              rows={1}
              data-testid="textarea-ai-input"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="shrink-0 h-9 w-9"
              data-testid="button-send-ai-message"
            >
              <Send size={14} />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">AI responses are for learning guidance — always verify with your course materials.</p>
        </div>
      </div>
    </div>
  );
}
