"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, Send, RefreshCcw, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";

const suggestedQuestions = [
  "ลูก 3 ขวบพูดไม่ชัด ควรฝึกอะไรดีคะ?",
  "กิจกรรมเสริมสมาธิสำหรับเด็ก 4 ขวบ",
  "วิธีฝึกให้ลูกสบตาคนอื่น",
  "เด็กออทิสติกควรเล่นเกมอะไร?",
  "ฝึกคำศัพท์ให้เด็กพูดช้าอย่างไรดี?",
  "วิธีรับมือลูก meltdown",
];

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

export default function AICoachPage() {
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai-coach" }),
  });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = async (q: string) => {
    if (isLoading) return;
    await sendMessage({ text: q });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-700 p-5 shrink-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">AI Coach</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-purple-200 text-sm">พร้อมช่วยคุณแม่เสมอ</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 rounded-xl transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            เริ่มใหม่
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 shrink-0">
        <p className="text-xs text-amber-700 text-center max-w-4xl mx-auto">
          ⚠️ AI Coach เป็นผู้ช่วยฝึกพัฒนาการเท่านั้น ไม่ใช่แพทย์ หากมีข้อกังวลทางสุขภาพกรุณาปรึกษาแพทย์
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-10 h-10 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                สวัสดีค่ะ! มีอะไรให้ช่วยไหมคะ?
              </h2>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                ถามได้ทุกเรื่องเกี่ยวกับพัฒนาการลูก AI จะวิเคราะห์และแนะนำกิจกรรมฝึกเฉพาะตัวสำหรับลูกคุณ
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    className="text-left text-sm px-4 py-3 bg-white rounded-xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50 text-gray-700 transition-colors shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const text = getMessageText(m);
            if (!text) return null;
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === "user"
                      ? "bg-purple-600"
                      : "bg-gradient-to-br from-purple-500 to-pink-500"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                    m.role === "user"
                      ? "bg-purple-600 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                  }`}
                >
                  {text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4 shrink-0">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ถามเกี่ยวกับพัฒนาการลูก..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 border-0 p-0 shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2 max-w-4xl mx-auto">
          AI Coach ไม่ใช่แพทย์ — คำแนะนำนี้เพื่อช่วยเสริมการดูแลลูกที่บ้านเท่านั้น
        </p>
      </div>
    </div>
  );
}
