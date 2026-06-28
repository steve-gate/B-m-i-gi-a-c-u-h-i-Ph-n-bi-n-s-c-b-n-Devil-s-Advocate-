import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Handshake, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  HelpCircle, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  X,
  Plus,
  ArrowRight,
  ChevronRight,
  BookOpen
} from "lucide-react";

interface NegotiationMessage {
  id: string;
  role: "user" | "opponent";
  text: string;
  timestamp: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  goal: string;
  initialOffer: string;
  opponentName: string;
  opponentTitle: string;
  opponentBehavior: string;
  opponentEmoji: string;
}

const PREDEFINED_SCENARIOS: Scenario[] = [
  {
    id: "salary",
    title: "Đàm Phán Tăng Lương",
    description: "Bạn đã cống hiến 2 năm tại công ty và hoàn thành xuất sắc các dự án lớn. Bạn muốn tăng lương lên 30% để xứng đáng với năng lực và thị trường, nhưng HR và Sếp đang muốn cắt giảm chi phí tối đa.",
    goal: "Lương mới: 26,000,000 VNĐ/tháng + được làm việc remote 2 ngày/tuần.",
    initialOffer: "Chỉ tăng 5% (tức lên 21,000,000 VNĐ) và không hỗ trợ làm remote.",
    opponentName: "Chị Mai Vy",
    opponentTitle: "Giám đốc Nhân sự (HRD) sắc sảo",
    opponentBehavior: "Rất am hiểu thị trường lao động, cứng rắn, luôn nhấn mạnh về lợi ích tập thể và ngân sách eo hẹp của công ty.",
    opponentEmoji: "👩‍💼"
  },
  {
    id: "funding",
    title: "Gọi Vốn Đầu Tư (Startup Funding)",
    description: "Startup AI của bạn đang phát triển nhanh và cần gấp 1 tỷ VNĐ để mở rộng thị trường. Bạn muốn chỉ nhượng bộ tối đa 12% cổ phần để giữ quyền kiểm soát, nhưng Shark Bình Minh muốn thâu tóm nhiều hơn.",
    goal: "Nhận 1 tỷ VNĐ đầu tư cho tối đa 12% cổ phần.",
    initialOffer: "1 tỷ VNĐ nhưng đòi tới 28% cổ phần kèm theo điều khoản cam kết doanh số khắt khe.",
    opponentName: "Shark Bình Minh",
    opponentTitle: "Nhà đầu tư lão luyện & thực tế",
    opponentBehavior: "Thích dìm giá trị định giá, hay đòi cổ phần chi phối hoặc quyền biểu quyết cao, xoáy sâu vào rủi ro vận hành.",
    opponentEmoji: "🦈"
  },
  {
    id: "lease",
    title: "Thương Lượng Mặt Bằng Kinh Doanh",
    description: "Bạn tìm thấy một mặt bằng góc 2 mặt tiền cực đẹp ở trung tâm để mở quán cà phê đặc sản. Chủ nhà muốn cho thuê giá cao, cọc 6 tháng. Bạn muốn giảm giá thuê và được miễn phí tiền thuê trong thời gian sửa chữa nhà.",
    goal: "Thuê giá 25 triệu VNĐ/tháng, cọc 3 tháng, miễn phí 1 tháng tiền nhà để thi công.",
    initialOffer: "Giá 30 triệu VNĐ/tháng, cọc 6 tháng, thanh toán mỗi 3 tháng, không miễn phí sửa nhà.",
    opponentName: "Bác Ba Phi",
    opponentTitle: "Chủ mặt bằng phố cổ giàu kinh nghiệm",
    opponentBehavior: "Nhà giàu, không vội cho thuê, thích khách thuê ổn định lâu dài nhưng tính toán rất chi ly từng đồng và ngại sửa chữa kết cấu.",
    opponentEmoji: "👴"
  }
];

export const NegotiationPanel: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("salary");
  const [customScenario, setCustomScenario] = useState<Partial<Scenario>>({
    title: "",
    description: "",
    goal: "",
    initialOffer: "",
    opponentName: "",
    opponentTitle: "",
    opponentBehavior: "",
    opponentEmoji: "🤝"
  });

  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [negotiationStarted, setNegotiationStarted] = useState(false);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Negotiation stats tracked dynamically
  const [stats, setStats] = useState({
    satisfaction: 40,
    trust: 50,
    friction: 30,
    currentOffer: ""
  });
  
  const [turnCount, setTurnCount] = useState(0);
  const maxTurns = 5;
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const TACTICS_TEMPLATES = [
    { text: "Đưa ra dẫn chứng & số liệu cụ thể: ", label: "📊 Dẫn chứng cụ thể" },
    { text: "Để giải quyết nỗi lo đó, tôi đề xuất nhượng bộ là: ", label: "🤝 Đề xuất nhượng bộ" },
    { text: "Chúng ta có thể hướng tới một giải pháp đôi bên cùng có lợi (Win-Win) bằng cách: ", label: "💡 Giải pháp Win-Win" },
    { text: "Nếu các điều khoản này không thể thương lượng, tôi e rằng phải tìm kiếm cơ hội khác: ", label: "🚪 Cảnh báo dừng hợp tác" }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleStart = () => {
    let scenario: Scenario;
    if (selectedScenarioId === "custom") {
      if (!customScenario.title || !customScenario.description || !customScenario.opponentName) {
        setErrorMsg("Vui lòng điền đầy đủ tiêu đề bối cảnh, mô tả và tên đối tác đàm phán.");
        return;
      }
      scenario = {
        id: "custom",
        title: customScenario.title || "Đàm phán tùy chọn",
        description: customScenario.description || "",
        goal: customScenario.goal || "Chưa thiết lập mục tiêu",
        initialOffer: customScenario.initialOffer || "Chưa thiết lập đề xuất ban đầu",
        opponentName: customScenario.opponentName || "Đối tác",
        opponentTitle: customScenario.opponentTitle || "Đối tác đàm phán",
        opponentBehavior: customScenario.opponentBehavior || "Sắc sảo, biết tính toán",
        opponentEmoji: customScenario.opponentEmoji || "🤝"
      };
    } else {
      scenario = PREDEFINED_SCENARIOS.find(s => s.id === selectedScenarioId)!;
    }

    setActiveScenario(scenario);
    setStats({
      satisfaction: 40,
      trust: 50,
      friction: 30,
      currentOffer: scenario.initialOffer
    });
    setMessages([
      {
        id: "init",
        role: "opponent",
        text: `Chào bạn, tôi là ${scenario.opponentName}. Rất vui được trao đổi hôm nay. Liên quan đến vấn đề ${scenario.title}, đề xuất hiện tại của tôi là: "${scenario.initialOffer}". Hãy cho tôi biết phản hồi và giải trình của bạn.`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setTurnCount(0);
    setEvaluation(null);
    setNegotiationStarted(true);
    setErrorMsg(null);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !activeScenario) return;

    const userMsg: NegotiationMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    setErrorMsg(null);

    const updatedTurnCount = turnCount + 1;
    setTurnCount(updatedTurnCount);

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          history: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
          lastMessage: userMsg.text,
          stats: stats,
          scenario: activeScenario
        })
      });

      if (!res.ok) {
        throw new Error("Không thể đàm phán với AI lúc này.");
      }

      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: "msg_" + Date.now() + "_opp",
        role: "opponent",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      }]);

      if (data.stats) {
        setStats(data.stats);
      }

      // Check if max turns reached
      if (updatedTurnCount >= maxTurns) {
        // Auto trigger evaluation
        triggerEvaluation([...messages, userMsg, {
          id: "temp",
          role: "opponent",
          text: data.reply,
          timestamp: ""
        }], data.stats);
      }

    } catch (err: any) {
      setErrorMsg(err.message || "Gặp lỗi kết nối máy chủ đàm phán.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEvaluation = async (historyList: NegotiationMessage[], currentStats = stats) => {
    if (!activeScenario) return;
    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluate",
          history: historyList.map(m => ({ role: m.role, text: m.text })),
          stats: currentStats,
          scenario: activeScenario
        })
      });

      if (!res.ok) {
        throw new Error("Không thể tải bản đánh giá đàm phán.");
      }

      const evalData = await res.json();
      setEvaluation(evalData);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleFinalizeEarly = () => {
    if (window.confirm("Bạn có chắc chắn muốn CHỐT THỎA THUẬN vào lúc này không? Hệ thống sẽ đánh giá kết quả dựa trên các lượt đàm phán hiện tại.")) {
      triggerEvaluation(messages);
    }
  };

  const handleWalkAway = () => {
    if (window.confirm("Bạn có chắc chắn muốn RÚT LUI khỏi bàn đàm phán? Thỏa thuận sẽ coi như thất bại và bạn sẽ nhận báo cáo kỹ năng đàm phán dựa trên những gì đã xảy ra.")) {
      const walkAwayStats = { ...stats, trust: Math.max(0, stats.trust - 20), friction: 100 };
      setStats(walkAwayStats);
      triggerEvaluation(messages, walkAwayStats);
    }
  };

  const handleReset = () => {
    setNegotiationStarted(false);
    setActiveScenario(null);
    setMessages([]);
    setEvaluation(null);
    setTurnCount(0);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-2 animate-fade-in" id="negotiation-arena">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 rounded-2xl p-6 text-white mb-6 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Handshake className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display">Đấu Trường Thương Lượng (Negotiation Arena)</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Tôi luyện kỹ thuật thuyết phục, xử lý từ chối và đạt mục tiêu tối ưu trước những đối thủ cứng rắn nhất.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs shadow-sm font-sans">
          <AlertCircle className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Có lỗi xảy ra:</span> {errorMsg}
          </div>
        </div>
      )}

      {!negotiationStarted ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scenario Picker (Left) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">
              1. Chọn Bối Cảnh Đàm Phán
            </h3>

            <div className="space-y-3">
              {PREDEFINED_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                    selectedScenarioId === sc.id
                      ? "bg-indigo-50/50 border-indigo-500 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-3xl p-2 bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0">
                    {sc.opponentEmoji}
                  </span>
                  <div className="font-sans flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className={`text-xs font-bold ${selectedScenarioId === sc.id ? "text-indigo-700" : "text-slate-800"}`}>
                        {sc.title}
                      </h4>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200/50 px-2 py-0.5 rounded-md font-bold font-mono">
                        {sc.opponentName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{sc.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100/70 text-[10px]">
                      <div>
                        <span className="font-bold text-emerald-600 block">🎯 Mục tiêu của bạn:</span>
                        <p className="text-slate-600 italic mt-0.5 truncate">{sc.goal}</p>
                      </div>
                      <div>
                        <span className="font-bold text-rose-500 block">🛑 Đề xuất khởi đầu:</span>
                        <p className="text-slate-600 italic mt-0.5 truncate">{sc.initialOffer}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Custom option */}
              <button
                onClick={() => setSelectedScenarioId("custom")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                  selectedScenarioId === "custom"
                    ? "bg-indigo-50/50 border-indigo-500 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                }`}
              >
                <span className="text-3xl p-2 bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0">
                  ⚙️
                </span>
                <div className="font-sans flex-1">
                  <h4 className={`text-xs font-bold ${selectedScenarioId === "custom" ? "text-indigo-700" : "text-slate-800"}`}>
                    Tự tạo bối cảnh (Custom Arena)
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Tự thiết kế đối thủ, bối cảnh đàm phán, mục tiêu và đề xuất khởi điểm của riêng bạn.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Form / Start (Right) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              {selectedScenarioId === "custom" ? (
                <div className="space-y-3 animate-fade-in">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Cấu Hình Đàm Phán Tự Chọn
                  </h3>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên bối cảnh</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đàm phán mua bản quyền nội dung"
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all font-sans"
                      value={customScenario.title || ""}
                      onChange={e => setCustomScenario({ ...customScenario, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả tình huống</label>
                    <textarea
                      placeholder="Ví dụ: Bạn muốn mua lại bản quyền bài viết của một tác giả tự do..."
                      rows={2}
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all font-sans"
                      value={customScenario.description || ""}
                      onChange={e => setCustomScenario({ ...customScenario, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên đối thủ</label>
                      <input
                        type="text"
                        placeholder="Bác Hoàng"
                        className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all font-sans"
                        value={customScenario.opponentName || ""}
                        onChange={e => setCustomScenario({ ...customScenario, opponentName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chức danh đối thủ</label>
                      <input
                        type="text"
                        placeholder="Tác giả tự do khó tính"
                        className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all font-sans"
                        value={customScenario.opponentTitle || ""}
                        onChange={e => setCustomScenario({ ...customScenario, opponentTitle: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mục tiêu của bạn</label>
                    <input
                      type="text"
                      placeholder="Mua bản quyền trọn đời với giá 5 triệu VNĐ"
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all font-sans"
                      value={customScenario.goal || ""}
                      onChange={e => setCustomScenario({ ...customScenario, goal: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đề xuất xuất phát của đối thủ</label>
                    <input
                      type="text"
                      placeholder="15 triệu VNĐ cho 1 năm sử dụng bản quyền"
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all font-sans"
                      value={customScenario.initialOffer || ""}
                      onChange={e => setCustomScenario({ ...customScenario, initialOffer: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đặc điểm tính cách của đối thủ</label>
                    <input
                      type="text"
                      placeholder="Thực tế, thích tiền mặt ngay lập tức nhưng đòi hỏi uy tín cao"
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all font-sans"
                      value={customScenario.opponentBehavior || ""}
                      onChange={e => setCustomScenario({ ...customScenario, opponentBehavior: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Thông tin nhân vật đàm phán
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                    <span className="text-4xl bg-white p-2.5 rounded-xl shadow-sm border border-slate-150">
                      {PREDEFINED_SCENARIOS.find(s => s.id === selectedScenarioId)?.opponentEmoji}
                    </span>
                    <div className="font-sans">
                      <h4 className="text-sm font-bold text-slate-800">
                        {PREDEFINED_SCENARIOS.find(s => s.id === selectedScenarioId)?.opponentName}
                      </h4>
                      <p className="text-[10px] text-indigo-600 font-bold font-mono">
                        {PREDEFINED_SCENARIOS.find(s => s.id === selectedScenarioId)?.opponentTitle}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs font-sans text-slate-600">
                    <p>
                      <span className="font-bold text-slate-800">💡 Phong cách đàm phán:</span>{" "}
                      {PREDEFINED_SCENARIOS.find(s => s.id === selectedScenarioId)?.opponentBehavior}
                    </p>
                    <p className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/60 text-amber-800 text-[11px] leading-relaxed">
                      ⚠️ <span className="font-bold">Lưu ý:</span> Đối thủ này rất kiên định và có cái tôi lớn. Hãy thương lượng có cơ sở thực tế thay vì đưa ra các đòi hỏi chung chung.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleStart}
              className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Handshake className="w-4 h-4" /> BẮT ĐẦU ĐÀM PHÁN 🤝
            </button>
          </div>
        </div>
      ) : evaluation ? (
        /* Negotiation Evaluation Report Panel */
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 text-white text-center border-b border-indigo-800">
            <div className="inline-flex p-3 bg-white/10 rounded-full mb-3 border border-white/20">
              <Award className="w-8 h-8 text-indigo-300" />
            </div>
            <h2 className="text-lg font-bold font-display">BẢN ĐÁNH GIÁ NĂNG LỰC THƯƠNG THUYẾT</h2>
            <p className="text-xs text-indigo-200 mt-1">
              Phân tích chuyên sâu về chiến thuật và kết quả đàm phán của bạn
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-8 font-sans">
            {/* Top Score & Verdict Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-50/30 border border-indigo-100/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider">
                  Kết Quả Đàm Phán
                </span>
                <span className={`text-sm font-bold mt-2 px-3 py-1 rounded-full ${
                  evaluation.verdict.includes("thành công") || evaluation.verdict.includes("Thành công")
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}>
                  {evaluation.verdict}
                </span>
              </div>

              <div className="bg-indigo-50/30 border border-indigo-100/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider">
                  Điểm Thương Thuyết
                </span>
                <div className="relative flex items-center justify-center mt-1">
                  <span className="text-3xl font-extrabold text-indigo-600 font-display">
                    {evaluation.score}
                  </span>
                  <span className="text-xs font-bold text-indigo-400 self-end mb-1 ml-0.5">/100</span>
                </div>
              </div>

              <div className="bg-indigo-50/30 border border-indigo-100/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider col-span-1">
                  Chốt Đề Xuất Cuối
                </span>
                <p className="text-xs text-slate-700 font-semibold italic mt-2 line-clamp-2">
                  "{evaluation.finalTerms || stats.currentOffer}"
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <span className="p-1 bg-emerald-100 rounded-lg text-emerald-600">✓</span> Điểm Mạnh Của Bạn
                </h4>
                <ul className="space-y-2">
                  {evaluation.strengths.map((str: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50/20 border border-rose-100/50 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-rose-800 flex items-center gap-2">
                  <span className="p-1 bg-rose-100 rounded-lg text-rose-600">✗</span> Điểm Cần Cải Thiện
                </h4>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((weak: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="text-rose-400 mt-0.5">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tactics Analysis */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Phân Tích Kỹ Thuật Thương Lượng Đã Sử Dụng
              </h4>
              <div className="space-y-3">
                {evaluation.tacticsAnalyzed.map((tac: any, i: number) => (
                  <div key={i} className="bg-white border border-slate-150 rounded-xl p-3.5 flex flex-col md:flex-row gap-2 md:items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 font-sans min-w-[180px]">
                      🛡️ {tac.tactic}
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed flex-1 md:pl-4 md:border-l border-slate-200">
                      {tac.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Advice */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Lời Khuyên Chiến Lược Từ Huấn Luyện Viên
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line italic">
                "{evaluation.improvementAdvice}"
              </p>
            </div>

            {/* Replay */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Bắt đầu cuộc thương lượng mới
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Active Negotiation Arena */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stats & Objective sidebar (Left) */}
          <div className="lg:col-span-4 space-y-4 font-sans">
            {/* Mission Objective Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold border-b border-slate-100 pb-2">
                Mục Tiêu Thương Lượng Của Bạn
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{activeScenario.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  {activeScenario.description}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-800 leading-normal">
                🎯 <span className="font-bold">Mục tiêu:</span> {activeScenario.goal}
              </div>
            </div>

            {/* Indicators dials/progress-bars */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold border-b border-slate-100 pb-2 flex justify-between">
                <span>Chỉ Số Tâm Lý Đối Tác</span>
                <span className="font-bold">Vòng {turnCount}/{maxTurns}</span>
              </div>

              {/* Trust gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-slate-600">🤝 Độ Tin Cậy (Trust)</span>
                  <span className="font-bold text-blue-600">{stats.trust}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.trust}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-400">Ảnh hưởng đến việc đối phương có chịu hợp tác lâu dài hay không</p>
              </div>

              {/* Satisfaction gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-slate-600">😊 Độ Hài Lòng (Satisfaction)</span>
                  <span className="font-bold text-amber-600">{stats.satisfaction}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.satisfaction}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-400">Độ hài lòng của đối tác về mức ưu đãi bạn đề xuất</p>
              </div>

              {/* Stress / Friction gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-slate-600">⚡ Sức Kháng Cự / Căng Thẳng (Friction)</span>
                  <span className="font-bold text-rose-500">{stats.friction}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.friction}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-400">Quá căng thẳng (trên 85%) đối phương sẽ đơn phương bỏ đàm phán</p>
              </div>

              {/* Current Offer summary */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-[11px] text-slate-700">
                <span className="font-bold text-slate-800 block mb-0.5">💰 Đề nghị hiện thời trên bàn:</span>
                <p className="italic font-medium text-slate-600 font-mono">"{stats.currentOffer}"</p>
              </div>
            </div>

            {/* Quick Actions / End controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleFinalizeEarly}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all cursor-pointer text-center"
              >
                ✍️ Chốt Thỏa Thuận
              </button>
              <button
                onClick={handleWalkAway}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 text-[11px] font-bold rounded-xl shadow-sm transition-all cursor-pointer text-center"
              >
                🚪 Rút Lui Đàm Phán
              </button>
            </div>
          </div>

          {/* Main Chat Conversation column (Right) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-sm">
            {/* Header Banner */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center px-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Phòng Thương Lượng Kịch Tính
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeScenario.opponentEmoji}</span>
                <span className="text-[10px] font-bold text-slate-700 font-mono bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                  {activeScenario.opponentName}
                </span>
              </div>
            </div>

            {/* Chat flow */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs font-sans leading-relaxed shadow-sm flex flex-col ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white font-medium rounded-tr-none border border-indigo-700"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none pr-6"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span
                      className={`text-[9px] font-mono self-end mt-2 opacity-70 ${
                        msg.role === "user" ? "text-white/80" : "text-slate-500"
                      }`}
                    >
                      {msg.role === "user" ? "BẠN" : activeScenario.opponentName.toUpperCase()} • {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-none p-4 max-w-[85%] flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300" />
                    <span className="text-xs font-mono text-slate-500 ml-1.5">Đối thủ đang suy tính phản hồi...</span>
                  </div>
                </div>
              )}

              {isEvaluating && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <span className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                  <p className="text-xs text-indigo-800 font-bold">Chuyên gia đang nghiên cứu hồ sơ đàm phán...</p>
                  <p className="text-[10px] text-slate-500">Quá trình này có thể tốn 3-5 giây để phân tích toàn vẹn chiến thuật.</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input & Tactics buttons */}
            {!evaluation && !isEvaluating && (
              <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
                {/* Tactics Quick Buttons */}
                <div className="flex gap-2 overflow-x-auto pb-1 select-none custom-scrollbar">
                  {TACTICS_TEMPLATES.map((reply, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInputText((prev) => reply.text + prev)}
                      className="flex-shrink-0 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-[10px] text-slate-700 font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>

                {/* Main input form */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập lý lẽ đàm phán, phản bác hoặc nhượng bộ giá trị của bạn..."
                    className="flex-1 bg-white border border-slate-200 focus:border-indigo-600 text-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-sans"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all cursor-pointer flex-shrink-0 flex items-center justify-center font-semibold shadow-md active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
