import React, { useState, useRef, useEffect } from "react";
import { DebateMessage, Persona } from "../types";
import { 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  AlertCircle, 
  Sparkles,
  ArrowLeft
} from "lucide-react";

interface DebatePanelProps {
  history: DebateMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activePersona: Persona;
  originalQuery: string;
  onGoBack: () => void;
  onReset: () => void;
}

export const DebatePanel: React.FC<DebatePanelProps> = ({
  history,
  onSendMessage,
  isLoading,
  activePersona,
  originalQuery,
  onGoBack,
  onReset,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_REPLIES = [
    { text: "Bản chất là...", label: "Giải thích rõ thực chất" },
    { text: "Bạn hiểu sai giả định ở chỗ...", label: "Bắt bẻ lại lập luận Ác Quỷ" },
    { text: "Tôi chấp nhận rủi ro này vì...", label: "Thừa nhận & Phòng bị" },
    { text: "Lập luận phản bác của bạn phạm ngụy biện...", label: "Tố cáo ngụy biện ngược lại" }
  ];

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in" id="debate-arena">
      {/* Context Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        {/* Go Back action */}
        <button
          onClick={onGoBack}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-all cursor-pointer font-medium pb-2 select-none"
        >
          <ArrowLeft className="w-4 h-4" /> TRỞ LẠI PHÂN TÍCH
        </button>

        {/* Current Target Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-mono text-blue-600 uppercase tracking-widest font-bold mb-1.5 label-context">
            MỤC TIÊU BẢO VỆ
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed italic border-l-2 border-blue-600 pl-3">
            "{originalQuery}"
          </p>
        </div>

        {/* Persona Profile card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-center pb-3">
            <span className="text-4xl block mb-2">{activePersona.emoji}</span>
            <h4 className="text-sm font-bold text-slate-900 font-display">{activePersona.name}</h4>
            <p className="text-[10px] text-blue-600 font-mono font-bold mt-0.5">{activePersona.title}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-sans">
            <span className="text-rose-600 font-semibold font-mono">Tâm lý phản đối:</span> {activePersona.description}
          </div>
        </div>

        {/* Standard controls */}
        <button
          onClick={onReset}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Khởi động lại Tranh luận
        </button>
      </div>

      {/* Main Debate conversation column */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center px-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
              Đấu trường tư duy đối kháng trực tiếp
            </h3>
          </div>
          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-0.5 rounded-md font-bold font-mono">
            LIVE DEBATE
          </span>
        </div>

        {/* Chat History Flow */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4">
              <Sparkles className="w-10 h-10 text-blue-500/40 mb-3" />
              <p className="text-sm font-semibold text-slate-800">Không nhượng bộ mặt logic!</p>
              <p className="text-xs text-slate-500 mt-1.5 font-sans leading-relaxed">
                Ác Quỷ Biện Hộ đang chờ bạn lên tiếng. Hãy gõ luận điểm phản biện mới nhất của bạn xuống khung chat hoặc chọn nhanh mẫu bên dưới để xem nó bị bẻ gãy thế nào nhé!
              </p>
            </div>
          ) : (
            history.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs font-sans leading-relaxed shadow-sm flex flex-col justify-between ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white font-medium rounded-tr-none border border-blue-700"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-none pr-6"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`text-[9px] font-mono self-end mt-2 opacity-70 ${
                      msg.role === "user" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    {msg.role === "user" ? "BẠN" : activePersona.name.toUpperCase()} • {msg.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-none p-4 max-w-[85%] flex items-center gap-2 shadow-sm">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-300" />
                <span className="text-xs font-mono text-slate-500 ml-1.5">Ác Quỷ đang truy lý...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Helper Area */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
          {/* Helper quick replies */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin select-none">
            {QUICK_REPLIES.map((reply, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText((prev) => (prev ? prev + " " + reply.text : reply.text))}
                className="flex-shrink-0 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-[10px] text-slate-700 font-medium rounded-lg transition-all cursor-pointer"
                title={reply.label}
              >
                💡 {reply.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập luận cứ biện minh, định nghĩa hoặc tranh biện..."
              className="flex-1 bg-white border border-slate-200 focus:border-blue-600 text-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-blue-600 transition-all font-sans"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className="p-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all cursor-pointer flex-shrink-0 flex items-center justify-center font-semibold shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
