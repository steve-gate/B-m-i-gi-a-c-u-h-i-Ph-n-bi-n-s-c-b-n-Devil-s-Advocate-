import { useState, useEffect } from "react";
import { 
  CritiqueResult, 
  DebateMessage, 
  SavedQuestion, 
  Persona 
} from "./types";
import { PERSONAS } from "./data/personas";
import { CritiquePanel } from "./components/CritiquePanel";
import { DebatePanel } from "./components/DebatePanel";
import { WorkoutPanel } from "./components/WorkoutPanel";
import { SavedCollection } from "./components/SavedCollection";
import { NegotiationPanel } from "./components/NegotiationPanel";
import { ArenasPanel } from "./components/ArenasPanel";
import { 
  Sparkles, 
  Layers, 
  Sliders, 
  Flame, 
  ShieldAlert, 
  BookOpen, 
  Zap, 
  Bot, 
  HelpCircle,
  Award,
  AlertCircle,
  Copy,
  Check,
  Handshake
} from "lucide-react";

export default function App() {
  // Navigation & configuration tabs
  const [activeTab, setActiveTab] = useState<"workspace" | "debate" | "workout" | "notebook" | "negotiation" | "arenas">("workspace");
  const [refinementMode, setRefinementMode] = useState<"question" | "idea" | "panel" | "evolve">("question");
  const [selectedAdvocate, setSelectedAdvocate] = useState<string>("socratic");
  const [selectedPanelAdvocates, setSelectedPanelAdvocates] = useState<string[]>(["first_principles", "psychologist", "problem_solving", "kaizen"]);
  
  // Data entries
  const [userInput, setUserInput] = useState("");
  const [critiqueResult, setCritiqueResult] = useState<CritiqueResult | null>(null);
  const [debateHistory, setDebateHistory] = useState<DebateMessage[]>([]);
  const [workoutScenario, setWorkoutScenario] = useState<any | null>(null);
  const [workoutEvaluation, setWorkoutEvaluation] = useState<string | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);

  // Spinners & flags
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [isDebating, setIsDebating] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [isEvaluatingWorkout, setIsEvaluatingWorkout] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Saved Notebook items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("devils_advocate_notebook");
      if (stored) {
        setSavedQuestions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Lỗi đọc dữ liệu lưu trữ từ LocalStorage:", e);
    }
  }, []);

  // Sync Saved Notebook items back to localStorage
  const saveToLocalStorage = (updated: SavedQuestion[]) => {
    localStorage.setItem("devils_advocate_notebook", JSON.stringify(updated));
    setSavedQuestions(updated);
  };

  const activePersona: Persona = PERSONAS.find(p => p.id === selectedAdvocate) || PERSONAS[0];

  // Action: Launch Critique Refinement Model
  const handleRunCritique = async () => {
    if (!userInput.trim()) {
      setErrorMessage("Vui lòng nhập câu hỏi hoặc ý tưởng của bạn trước.");
      return;
    }
    setIsCritiquing(true);
    setErrorMessage(null);
    setCritiqueResult(null);

    try {
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userInput,
          mode: refinementMode,
          advocateType: selectedAdvocate,
          panelAdvocates: refinementMode === "panel" ? selectedPanelAdvocates : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Không thể thực hiện phản biện.");
      }

      const critiqueData: CritiqueResult = await res.json();
      setCritiqueResult(critiqueData);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể kết nối máy chủ dịch vụ.");
    } finally {
      setIsCritiquing(false);
    }
  };

  // Action: Save the result to notebook
  const handleSaveResult = () => {
    if (!critiqueResult) return;
    
    // Check if already saved
    if (savedQuestions.some(item => item.originalText === critiqueResult.originalQuery)) {
      return;
    }

    const newItem: SavedQuestion = {
      id: "sav_" + Date.now(),
      title: userInput.length > 30 ? userInput.substring(0, 30) + "..." : userInput,
      originalText: critiqueResult.originalQuery,
      improvedText: critiqueResult.reframedVersion,
      scores: critiqueResult.scores,
      advocateType: selectedAdvocate,
      timestamp: new Date().toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      score: critiqueResult.score,
      actionPlan: critiqueResult.actionPlan,
    };

    const updated = [newItem, ...savedQuestions];
    saveToLocalStorage(updated);
  };

  // Action: Remove notebook entry
  const handleRemoveSaved = (id: string) => {
    const updated = savedQuestions.filter(item => item.id !== id);
    saveToLocalStorage(updated);
  };

  // Action: Select item from notebook to view
  const handleSelectSaved = (item: SavedQuestion) => {
    setUserInput(item.originalText);
    setSelectedAdvocate(item.advocateType);
    setCritiqueResult({
      originalQuery: item.originalText,
      scores: item.scores,
      blindSpots: ["Lấy từ nhật ký lưu trữ"],
      logicalFallacies: ["Lấy từ nhật ký lưu trữ"],
      unintendedConsequences: ["Lấy từ nhật ký lưu trữ"],
      reframedVersion: item.improvedText,
      alternativeOptions: [],
      challengeQuestions: ["Tiếp tục mài sắc thêm phiên bản này hoặc tranh biện trực tiếp!"],
      verdict: "Nhật ký lưu trữ. Bạn có thể sử dụng câu hỏi này ngay.",
      score: item.score,
      actionPlan: item.actionPlan,
    });
    setActiveTab("workspace");
  };

  // Action: Start direct chat debate
  const handleStartDebate = () => {
    if (!userInput.trim()) return;
    setDebateHistory([]);
    setActiveTab("debate");
  };

  // Action: Multi-turn debate send message
  const handleSendDebateMessage = async (text: string) => {
    const userMsg: DebateMessage = {
      id: "usr_" + Date.now(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    const nextHistory = [...debateHistory, userMsg];
    setDebateHistory(nextHistory);
    setIsDebating(true);

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: debateHistory,
          lastMessage: text,
          advocateType: selectedAdvocate,
          originalContext: critiqueResult?.verdict || userInput
        })
      });

      if (!res.ok) {
        throw new Error("Lỗi kết nối máy chủ tranh luận.");
      }

      const data = await res.json();
      const modelMsg: DebateMessage = {
        id: "mod_" + Date.now(),
        role: "model",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };
      setDebateHistory([...nextHistory, modelMsg]);
    } catch (err: any) {
      setErrorMessage("Không thể phản hồi tranh luận: " + err.message);
    } finally {
      setIsDebating(false);
    }
  };

  // Action: Load dynamic workout scenario
  const handleLoadWorkoutScenario = async (topic: string) => {
    setIsGeneratingWorkout(true);
    setWorkoutEvaluation(null);
    setWorkoutScenario(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });

      if (!res.ok) {
        throw new Error("Không thể khởi động kịch bản.");
      }

      const data = await res.json();
      setWorkoutScenario(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  // Action: Submit dilemma workout response for review
  const handleSubmitWorkoutAnswer = async (answer: string) => {
    setIsEvaluatingWorkout(true);
    setWorkoutEvaluation(null);

    try {
      // We leverage the `/api/debate` or proxy a custom prompt to evaluate
      const context = `Tình huống: ${workoutScenario?.scenario}\n\nLựa chọn thách thức: ${workoutScenario?.devilChallenge}`;
      const evaluationPrompt = `
Chào nhà phản biện ác quỷ! Đây là bản giải thích đáp án của người dùng cho tính huống nghịch lý sau:
"${answer}"

Bối cảnh tình huống:
"${context}"

Hãy đóng vai người phản biện sắc bén nhất, đánh giá thật thẳng thắn luận cứ của họ. Cần phân tích:
1. Điểm mạnh và cơ sở logic trong lập trường của họ.
2. Các lỗi ngải cứu logic hoặc giả định ngầm chưa thoả đáng còn tồn tại trong câu trả lời.
3. Câu hỏi vặn vẹo 'đá xoáy' cuối cùng để xem họ có giữ vững được lập trường lý luận hay không.

Hãy viết theo phong cách chuyên nghiệp, tinh tế, sắc sảo lôi cuốn bằng Tiếng Việt. Chia thành các đầu mục rõ ràng để dễ tiếp thu. Đưa ra một số điểm chấm điểm tư duy từ 0-100%.
`;

      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: [],
          lastMessage: evaluationPrompt,
          advocateType: "purist", // Pure analytical logic
          originalContext: context
        })
      });

      if (!res.ok) {
        throw new Error("Hệ thống đánh giá tư duy bận rộn.");
      }

      const data = await res.json();
      setWorkoutEvaluation(data.reply);
    } catch (err: any) {
      setErrorMessage("Lỗi đánh giá kịch bản: " + err.message);
    } finally {
      setIsEvaluatingWorkout(false);
    }
  };

  const isSavedNotebookEntry = critiqueResult 
    ? savedQuestions.some(item => item.originalText === critiqueResult.originalQuery)
    : false;

  return (
    <div className="min-h-screen text-slate-800 font-sans bg-slate-50/80 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative">
      
      {/* Decorative Top Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-500/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-indigo-500/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

      {/* Primary Container Wrap */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex-1 flex flex-col">
        
        {/* Header Branding */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8 mt-2">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <span className="text-3xl filter drop-shadow">😈</span>
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-slate-900">
                  ÁC QUỶ BIỆN HỘ
                </h1>
                <span className="text-[9px] font-mono tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase font-bold">
                  v3.5 PRO WORKSPACE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Công cụ mài sắc câu hỏi, bóc tách điểm mù logic & rèn luyện tư duy phản biện đỉnh cao
              </p>
            </div>
          </div>

          {/* Tab Navigation Menu */}
          <nav className="flex bg-white border border-slate-250/80 rounded-2xl p-1 gap-1 select-none w-full md:w-auto overflow-x-auto shadow-sm">
            {[
              { id: "workspace", label: "Mài Giũa Tư Duy", icon: Layers },
              { id: "debate", label: "Đấu Trường Đối Trực", icon: Bot },
              { id: "negotiation", label: "Thương Lượng", icon: Handshake },
              { id: "arenas", label: "Tổ Hợp Đấu Trường", icon: Flame },
              { id: "workout", label: "Nghịch Lý Dilemma", icon: Zap },
              { id: "notebook", label: "Sổ Tay Tri Thức", icon: BookOpen }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2 font-medium text-xs rounded-xl cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-100 font-bold text-slate-800 border border-slate-250/40"
                    : "text-slate-500 hover:text-slate-850"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs animate-fade-in font-sans shadow-sm">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-rose-500" />
            <div>
              <span className="font-bold">Lưu ý phân tích:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* Main Workspace Stage */}
        <main className="flex-1">
          {activeTab === "workspace" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column Controls */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Mode Selector Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                      Cơ chế điều hành mài giũa
                    </h3>
                  </div>

                  {/* Question vs Idea options */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">
                      1. Chọn nội dung sát hạch
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        onClick={() => setRefinementMode("question")}
                        className={`py-3 px-2 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all ${
                          refinementMode === "question"
                            ? "bg-blue-50 text-blue-700 border-blue-400/60 font-semibold"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        Mài Giũa Câu Hỏi ❓
                        <span className="hidden md:block text-[9px] font-normal font-sans opacity-60 mt-0.5">Lọc định kiến, tăng hiệu quả</span>
                      </button>
                      <button
                        onClick={() => setRefinementMode("idea")}
                        className={`py-3 px-2 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all ${
                          refinementMode === "idea"
                            ? "bg-blue-50 text-blue-700 border-blue-400/60 font-semibold"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        Thử Thách Ý Tưởng 💡
                        <span className="hidden md:block text-[9px] font-normal font-sans opacity-60 mt-0.5">Tìm điểm mù, stress-test</span>
                      </button>
                      <button
                        onClick={() => setRefinementMode("panel")}
                        className={`py-3 px-2 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all ${
                          refinementMode === "panel"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-400/60 font-semibold"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        Hội Đồng ⚖️
                        <span className="hidden md:block text-[9px] font-normal font-sans opacity-60 mt-0.5">Góc nhìn Đa chiều (Panel)</span>
                      </button>
                      <button
                        onClick={() => setRefinementMode("evolve")}
                        className={`py-3 px-2 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all ${
                          refinementMode === "evolve"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-400/60 font-semibold"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        Auto-Evolve 🚀
                        <span className="hidden md:block text-[9px] font-normal font-sans opacity-60 mt-0.5">Nâng cấp Bulletproof</span>
                      </button>
                    </div>
                  </div>

                  {/* Persona Advocate Picker */}
                  {refinementMode !== "panel" && refinementMode !== "evolve" && (
                    <div className="space-y-2 pt-2">
                      <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">
                        2. Chọn Nhân vật Phản Biện Ác Quỷ (Persona)
                      </span>
                      <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(
                          PERSONAS.reduce((acc, persona) => {
                            const group = persona.group || "Khác";
                            if (!acc[group]) acc[group] = [];
                            acc[group].push(persona);
                            return acc;
                          }, {} as Record<string, typeof PERSONAS>)
                        ).map(([groupName, groupPersonas]) => (
                          <div key={groupName} className="mb-3 last:mb-0">
                            <div className="text-[10px] font-bold text-slate-400 bg-white/95 backdrop-blur sticky top-0 z-10 py-1.5 mb-1.5">
                              {groupName}
                            </div>
                            <div className="space-y-2">
                              {groupPersonas.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedAdvocate(p.id);
                                  }}
                                  className={`flex items-start text-left p-3 rounded-xl border transition-all cursor-pointer w-full ${
                                    selectedAdvocate === p.id
                                      ? "bg-blue-50/50 border-blue-600 shadow-sm"
                                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="text-2xl p-1 bg-slate-50 rounded-lg border border-slate-200 mr-3">{p.emoji}</span>
                                  <div className="font-sans">
                                    <h4 className={`text-xs font-bold leading-none ${selectedAdvocate === p.id ? "text-blue-700 font-bold" : "text-slate-800"}`}>
                                      {p.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-semibold leading-tight mt-1">{p.title}</p>
                                    <p className="text-[9px] text-slate-500 leading-snug mt-1 italic">{p.description}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {refinementMode === "panel" && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">
                          2. Chọn Thành Viên Hội Đồng
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {selectedPanelAdvocates.length}/4 đã chọn
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(
                          PERSONAS.reduce((acc, persona) => {
                            const group = persona.group || "Khác";
                            if (!acc[group]) acc[group] = [];
                            acc[group].push(persona);
                            return acc;
                          }, {} as Record<string, typeof PERSONAS>)
                        ).map(([groupName, groupPersonas]) => (
                          <div key={groupName} className="mb-3 last:mb-0">
                            <div className="text-[10px] font-bold text-slate-400 bg-white/95 backdrop-blur sticky top-0 z-10 py-1.5 mb-1.5">
                              {groupName}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {groupPersonas.map((p) => {
                                const isSelected = selectedPanelAdvocates.includes(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedPanelAdvocates(selectedPanelAdvocates.filter(id => id !== p.id));
                                      } else {
                                        if (selectedPanelAdvocates.length < 4) {
                                          setSelectedPanelAdvocates([...selectedPanelAdvocates, p.id]);
                                        }
                                      }
                                    }}
                                    className={`flex items-center text-left p-2 rounded-xl border transition-all cursor-pointer w-full ${
                                      isSelected
                                        ? "bg-indigo-50/50 border-indigo-600 shadow-sm"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50 opacity-70"
                                    }`}
                                  >
                                    <span className="text-xl p-1 bg-slate-50 rounded-lg border border-slate-200 mr-2">{p.emoji}</span>
                                    <div className="font-sans overflow-hidden">
                                      <h4 className={`text-[10px] font-bold truncate leading-none ${isSelected ? "text-indigo-700 font-bold" : "text-slate-800"}`}>
                                        {p.name}
                                      </h4>
                                    </div>
                                    {isSelected && <Check className="w-3 h-3 text-indigo-600 ml-auto flex-shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column Workspace area */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Text input controller */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      Nhập nội dung cần mài giũa (TIẾNG VIỆT/ENGLISH)
                    </span>
                    
                    <button
                      onClick={() => {
                        let demoText = "";
                        if (refinementMode === "question") demoText = "Liệu trí tuệ nhân tạo (AI) có cướp đi toàn bộ công việc sáng tạo của con người trong tương lai hoặc làm suy giảm kỹ năng tư duy?";
                        else if (refinementMode === "idea") demoText = "Ý tưởng khởi nghiệp: Thành lập một ứng dụng cộng đồng kết nối người dùng để cùng mua chung và chia sẻ chi phí thuê sách giấy cũ ở các đô thị.";
                        else if (refinementMode === "panel") demoText = "Ý tưởng: Tạo ra một nền tảng học tập mà ở đó học sinh được trả tiền bằng token crypto mỗi khi giải xong bài tập về nhà.";
                        else demoText = "Tạo một ứng dụng báo thức, nếu người dùng không dậy đúng giờ sẽ tự động trừ tiền trong tài khoản và quyên góp cho tổ chức từ thiện mà họ ghét nhất.";
                        setUserInput(demoText);
                      }}
                      className="text-[10px] font-semibold text-slate-500 hover:text-blue-600 font-mono transition-colors cursor-pointer border border-slate-200 px-2 py-0.5 rounded-md hover:bg-slate-50 shadow-sm"
                    >
                      Bản mẫu Demo
                    </button>
                  </div>

                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                      refinementMode === "question"
                        ? "Vấn đề bạn đang đắn đo suy nghĩ là gì? Ví dụ: 'Tôi nên mua nhà trả góp hay đầu tư chứng khoán?'"
                        : refinementMode === "idea" 
                        ? "Phát biểu ý tưởng hoặc dự định hành động của bạn. Ví dụ: 'Xây dựng dịch vụ giao đồ ăn đêm dựa trên tối ưu nhân sự bán thời gian...'"
                        : refinementMode === "panel"
                        ? "Đưa ý tưởng của bạn ra trước 4 vị giám khảo khó tính nhất để nhận gạch đá từ mọi góc độ..."
                        : "Nhập một ý tưởng thô và xem hệ thống tự động vá lỗi, rèn giũa thành phiên bản chống đạn (Bulletproof)..."
                    }
                    rows={4}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 text-slate-850 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-blue-600 font-sans leading-relaxed transition-all shadow-inner animate-fade-in"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleRunCritique}
                      disabled={isCritiquing || !userInput.trim()}
                      className="w-full sm:w-auto px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed font-bold text-xs rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
                    >
                      {isCritiquing ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Socrates đang lật giả thiết...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 text-white" />
                          <span>BẮT ĐẦU SÁT HẠCH PHẢN BIỆN ⚔️</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Output critique results inside workspace page */}
                {critiqueResult ? (
                  <CritiquePanel
                    critique={critiqueResult}
                    personaName={
                      refinementMode === "panel" ? "Hội Đồng Đa Góc Nhìn" :
                      refinementMode === "evolve" ? "Chuyên Gia Bulletproof" :
                      activePersona.name
                    }
                    personaEmoji={
                      refinementMode === "panel" ? "⚖️" :
                      refinementMode === "evolve" ? "🚀" :
                      activePersona.emoji
                    }
                    onSave={handleSaveResult}
                    isSaved={isSavedNotebookEntry}
                    onStartDebate={handleStartDebate}
                  />
                ) : (
                  !isCritiquing && (
                    <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center opacity-85 min-h-[250px] shadow-sm">
                      <Bot className="w-10 h-10 text-slate-400/50 mb-3 animate-pulse-slow font-bold" />
                      <p className="text-xs font-bold text-slate-700">Thiết lập bộ phản biện của bạn và chạy phân tích</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mt-1.5 leading-relaxed font-sans">
                        Nhấn nút 'BẮT ĐẦU SÁT HẠCH PHẢN BIỆN' để hiển thị báo cáo logic bao gồm Điểm mù, Lỗi ngụy biện và Câu hỏi mài sắc.
                      </p>
                    </div>
                  )
                )}

                {/* Processing Placeholder layout */}
                {isCritiquing && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-pulse shadow-sm">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                        <div className="h-2 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-4">
                      <div className="h-2 bg-slate-100 rounded w-full" />
                      <div className="h-2 bg-slate-100 rounded w-5/6" />
                      <div className="h-2 bg-slate-100 rounded w-3/4" />
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {activeTab === "debate" && (
            <DebatePanel
              history={debateHistory}
              onSendMessage={handleSendDebateMessage}
              isLoading={isDebating}
              activePersona={activePersona}
              originalQuery={userInput || "Phát biểu chung của bạn"}
              onGoBack={() => setActiveTab("workspace")}
              onReset={() => setDebateHistory([])}
            />
          )}

          {activeTab === "negotiation" && (
            <NegotiationPanel />
          )}

          {activeTab === "arenas" && (
            <ArenasPanel />
          )}

          {activeTab === "workout" && (
            <WorkoutPanel
              scenario={workoutScenario}
              onLoadScenario={handleLoadWorkoutScenario}
              onSubmitResponse={handleSubmitWorkoutAnswer}
              isGenerating={isGeneratingWorkout}
              isEvaluating={isEvaluatingWorkout}
              evaluationResult={workoutEvaluation}
            />
          )}

          {activeTab === "notebook" && (
            <SavedCollection
              items={savedQuestions}
              onRemove={handleRemoveSaved}
              onSelect={handleSelectSaved}
            />
          )}
        </main>

      </div>

      {/* Footer information bar */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-16 text-center select-none text-[11px] text-slate-400 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <p>© 2026 Devil's Advocate Workspace. Thiết kế cho tư duy vượt giới hạn.</p>
          <div className="flex gap-4 items-center justify-center font-bold">
            <span className="text-blue-600">Socratic Method</span>
            <span>•</span>
            <span className="text-blue-600">Murphy's Law Defense</span>
            <span>•</span>
            <span className="text-blue-600">Logical Purism</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
