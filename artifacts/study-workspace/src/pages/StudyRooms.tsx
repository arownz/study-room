import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Timer, Send, Plus, CheckSquare, Square, Mic, MicOff, Video, VideoOff, Globe, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { mockStudyRooms } from "@/lib/mock-data";

type Room = typeof mockStudyRooms[number];

const statusColor: Record<string, string> = {
  active: "bg-emerald-400",
  idle: "bg-amber-400",
  offline: "bg-muted-foreground",
};

export default function StudyRooms() {
  const [activeRoom, setActiveRoom] = useState<Room>(mockStudyRooms[0]);
  const [rooms, setRooms] = useState(mockStudyRooms);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(mockStudyRooms[0].messages);
  const [tasks, setTasks] = useState(mockStudyRooms[0].tasks);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);

  const selectRoom = (room: Room) => {
    setActiveRoom(room);
    setMessages(room.messages);
    setTasks(room.tasks);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg = { sender: "Harold Pasion", avatar: "HP", text: message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");
  };

  const toggleTask = (i: number) => {
    setTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] -m-6 overflow-hidden border border-border/40 rounded-xl">
      {/* Room list */}
      <div className="w-56 border-r border-border/60 bg-sidebar flex flex-col shrink-0">
        <div className="p-3 border-b border-border/60 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Study Rooms</p>
          <Button size="icon" className="h-6 w-6" data-testid="button-create-room">
            <Plus size={12} />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => selectRoom(room)}
                className={cn(
                  "w-full text-left rounded-md p-2.5 transition-colors",
                  activeRoom.id === room.id ? "bg-sidebar-accent" : "hover:bg-muted/50"
                )}
                data-testid={`room-list-item-${room.id}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-medium truncate">{room.name}</p>
                  {room.timerRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Users size={10} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{room.participants.length}/{room.maxParticipants}</span>
                  {room.isPublic ? <Globe size={9} className="text-muted-foreground ml-auto" /> : <Lock size={9} className="text-muted-foreground ml-auto" />}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main room area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Room header */}
        <div className="border-b border-border/60 px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{activeRoom.name}</h3>
              <Badge variant="secondary" className="text-[10px]">{activeRoom.subject}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{activeRoom.topic}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <Timer size={12} className="text-primary" />
              <span className="font-mono font-semibold">{activeRoom.timer}</span>
            </div>
            <Button
              variant={micOn ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setMicOn(m => !m)}
              data-testid="button-toggle-mic"
            >
              {micOn ? <Mic size={14} /> : <MicOff size={14} />}
            </Button>
            <Button
              variant={camOn ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setCamOn(c => !c)}
              data-testid="button-toggle-cam"
            >
              {camOn ? <Video size={14} /> : <VideoOff size={14} />}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Participants */}
            <div className="border-b border-border/60 px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Participants:</span>
              <div className="flex items-center gap-2">
                {activeRoom.participants.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5" data-testid={`participant-${p.name.toLowerCase().replace(/\s/g, "-")}`}>
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">{p.avatar}</AvatarFallback>
                      </Avatar>
                      <span className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background", statusColor[p.status])} />
                    </div>
                    <span className="text-xs text-muted-foreground hidden md:block">{p.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No messages yet. Start the conversation.
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.sender === "Harold Pasion";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex items-start gap-2.5", isMe && "flex-row-reverse")}
                      data-testid={`message-${i}`}
                    >
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">{msg.avatar}</AvatarFallback>
                      </Avatar>
                      <div className={cn("max-w-xs", isMe && "items-end flex flex-col")}>
                        <div className="flex items-center gap-2 mb-0.5">
                          {!isMe && <span className="text-[10px] font-semibold">{msg.sender}</span>}
                          <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <div className={cn("rounded-xl px-3 py-2 text-xs", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="border-t border-border/60 p-3 flex gap-2">
              <Input
                placeholder={`Message ${activeRoom.name}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="text-sm"
                data-testid="input-message"
              />
              <Button size="icon" onClick={sendMessage} data-testid="button-send-message">
                <Send size={14} />
              </Button>
            </div>
          </div>

          {/* Tasks sidebar */}
          <div className="w-56 border-l border-border/60 flex flex-col shrink-0">
            <div className="p-3 border-b border-border/60">
              <p className="text-xs font-semibold">Session Goals</p>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {tasks.map((task, i) => (
                  <button
                    key={i}
                    onClick={() => toggleTask(i)}
                    className="flex items-start gap-2 w-full text-left group"
                    data-testid={`task-item-${i}`}
                  >
                    {task.done ? (
                      <CheckSquare size={14} className="text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Square size={14} className="text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5 transition-colors" />
                    )}
                    <span className={cn("text-xs leading-snug", task.done && "line-through text-muted-foreground")}>{task.text}</span>
                  </button>
                ))}
                {tasks.length === 0 && (
                  <p className="text-xs text-muted-foreground">No tasks yet.</p>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border/60">
              <Input placeholder="Add goal..." className="text-xs h-7" data-testid="input-add-task" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
