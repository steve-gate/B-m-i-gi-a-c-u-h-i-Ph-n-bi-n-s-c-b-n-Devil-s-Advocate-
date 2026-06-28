import React, { useState } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  Send,
  Lock,
  ChevronRight,
  Flame,
  Award,
  Zap
} from "lucide-react";

interface Choice {
  id: string;
  text: string;
  implication: string;
}

interface DifficultyScenario {
  title: string;
  scenario: string;
  choices: Choice[];
  devilChallenge: string;
}

interface WorkoutPanelProps {
  scenario: DifficultyScenario | null;
  onLoadScenario: (topic: string) => void;
  onSubmitResponse: (userAnswer: string) => Promise<void>;
  isGenerating: boolean;
  isEvaluating: boolean;
  evaluationResult: string | null;
}

export const WorkoutPanel: React.FC<WorkoutPanelProps> = ({
  scenario,
  onLoadScenario,
  onSubmitResponse,
  isGenerating,
  isEvaluating,
  evaluationResult,
}) => {
  const [selectedTopic, setSelectedTopic] = useState("Công nghệ, Đạo đức & Tự động hoá");
  const [userAnswer, setUserAnswer] = useState("");
  const [choiceSelected, setChoiceSelected] = useState<string | null>(null);

  const TOPICS = [
    "Công nghệ, Đạo đức & Tự động hoá",
    "Kinh tế thị trường vs Phân phối Công bằng",
    "Bảo mật quyền riêng tư cá nhân vs An ninh Quốc gia",
    "Nghịch lý Omelas: Sức khỏe cộng đồng vs Quyền con người"
  ];

  const handleTopicSelection = (topic: string) => {
    setSelectedTopic(topic);
    onLoadScenario(topic);
    setChoiceSelected(null);
    setUserAnswer("");
  };

  const handleChoiceClick = (choice: Choice) => {
    setChoiceSelected(choice.id);
    setUserAnswer(`[Tôi chọn Phương án ${choice.id}]: ${choice.text}\n\nLý do biện hộ logic của tôi:\n- Vì `);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    onSubmitResponse(userAnswer);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="workout-lab">
      {/* Topics selection bar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h4 className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest mb-3">
            Danh mục Phòng Thử Nghiệm
          </h4>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-sans">
            Mỗi chủ đề chứa những hạt nhân nghịch lý đạo đức tinh tế để thử thách tư duy phản biện của bạn. Hãy chọn một chủ đề bên dưới thúc đẩy bộ não vận động:
          </p>
          <div className="space-y-2.5">
            {TOPICS.map((topic, index) => (
              <button
                key={index}
                onClick={() => handleTopicSelection(topic)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                  selectedTopic === topic
                    ? "bg-blue-50 text-blue-700 border-blue-400/60 font-semibold"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                }`}
              >
                <span>{topic}</span>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Motivational status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <Flame className="w-8 h-8 text-rose-500 mx-auto mb-2 animate-bounce" />
          <h5 className="text-xs font-bold text-slate-800">Sát Hạch Trí Óc Mỗi Ngày</h5>
          <p className="text-[10px] text-slate-500 font-sans mt-1">
            "Không có chân lý nào là tuyệt đối cho đến khi nó nỗ lực vượt qua được các phép thử phản biện tồi tệ nhất."
          </p>
        </div>
      </div>

      {/* Main workout exercise container */}
      <div className="lg:col-span-2 space-y-5">
        {!scenario ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[350px] shadow-sm">
            <Sparkles className="w-12 h-12 text-slate-400/40 mb-3 animate-spin-slow" />
            <p className="text-sm font-semibold text-slate-700">Sẵn sàng kích hoạt bài tập?</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed font-sans">
              Chọn chủ đề bên trái để Devil's Advocate biên soạn một kịch bản chất lượng, mâu thuẫn cao độ ngay lập tức!
            </p>
            <button
              onClick={() => handleTopicSelection(selectedTopic)}
              disabled={isGenerating}
              className="mt-5 px-5 py-2.5 bg-blue-600 text-white font-medium text-xs rounded-xl hover:bg-blue-700 active:scale-95 transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isGenerating ? "Hệ thống đang mô tả..." : "Kích hoạt Kịch bản Tập luyện ⚡"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Scenario Detailed Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                <span className="p-1 px-2.5 bg-rose-50 text-rose-700 border border-rose-200/60 text-[9px] font-mono rounded-md font-bold">
                  DILEMMA LAB
                </span>
                <h3 className="text-sm font-bold text-slate-900 font-display">{scenario.title}</h3>
              </div>

              <p className="text-slate-700 text-xs leading-relaxed mb-4 font-sans whitespace-pre-line">
                {scenario.scenario}
              </p>

              {/* Choices comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 select-none">
                {scenario.choices.map((choice) => (
                  <div
                    key={choice.id}
                    onClick={() => handleChoiceClick(choice)}
                    className={`p-4 border rounded-xl text-left cursor-pointer transition-all hover:scale-[1.01] ${
                      choiceSelected === choice.id
                        ? "bg-blue-50/20 border-blue-500 shadow-sm"
                        : "bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        choice.id === "A" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-teal-50 text-teal-700 border border-teal-200/80"
                      }`}>
                        PHƯƠNG ÁN {choice.id}
                      </span>
                    </div>
                    <p className="text-slate-800 text-xs font-bold mb-2 font-display">{choice.text}</p>
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-600 leading-normal font-sans">
                        <span className="text-rose-600 font-semibold">Hệ lụy gián tiếp:</span> {choice.implication}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Devil Challenge Prompt */}
              <div className="bg-slate-50 p-4 border border-slate-250/20 rounded-xl flex items-start gap-3">
                <span className="text-2xl pt-0.5">😈</span>
                <div>
                  <p className="text-[10px] uppercase font-mono text-rose-600 tracking-wider font-bold">Lời Thách Thức của Ác Quỷ</p>
                  <p className="text-[11px] text-slate-600 leading-normal font-sans mt-0.5 italic">
                    "{scenario.devilChallenge}"
                  </p>
                </div>
              </div>
            </div>

            {/* Answer Box Submission */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2 font-bold">
                    Biện hộ & Lập luận của Bạn
                  </label>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Hãy viết ít nhất 2 câu trình bày góc phân tích của bạn chi tiết và logic..."
                    rows={4}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 text-slate-850 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-blue-600 font-sans leading-relaxed transition-all"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-sans">
                    💡 Hãy click vào các hộp lựa chọn ở trên để lấy template định hướng nhanh.
                  </span>
                  <button
                    type="submit"
                    disabled={isEvaluating || !userAnswer.trim()}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all h-10 flex items-center gap-2 cursor-pointer disabled:bg-slate-100 disabled:text-slate-450 select-none active:scale-[0.98] shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    {isEvaluating ? "Đang đánh giá luận chứng..." : "Nộp Giải pháp Tranh luận"}
                  </button>
                </div>
              </form>
            </div>

            {/* Evaluation scorecard / Result critique display */}
            {evaluationResult && (
              <div className="bg-white border-2 border-emerald-600/20 rounded-2xl p-5 md:p-6 shadow-sm animate-fade-in">
                <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
                  <span className="p-1 px-2.5 bg-emerald-50 text-emerald-700 border border-emerald-250/20 text-[9px] font-mono rounded-md font-bold uppercase">
                    BÀI ĐÁNH GIÁ TƯ DUY (LOGICAL ANALYSIS SCORECARD)
                  </span>
                </div>
                
                <div className="text-xs text-slate-700 space-y-3 font-sans leading-relaxed whitespace-pre-wrap">
                  {evaluationResult}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-500">
                    💡 Bạn có muốn nỗ lực thử thách một chủ đề hóc búa hơn bên cạnh?
                  </span>
                  <button
                    onClick={() => {
                      setChoiceSelected(null);
                      setUserAnswer("");
                      onLoadScenario(selectedTopic);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-lg transition-all cursor-pointer"
                  >
                    Tải Tình Huống Mới Toanh 🔄
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
