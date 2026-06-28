import React, { useState } from "react";
import { CritiqueResult } from "../types";
import { 
  AlertTriangle, 
  Check, 
  Copy, 
  Compass, 
  ShieldAlert, 
  Zap, 
  HelpCircle, 
  Award,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight
} from "lucide-react";

interface CritiquePanelProps {
  critique: CritiqueResult;
  personaName: string;
  personaEmoji: string;
  onSave: () => void;
  isSaved: boolean;
  onStartDebate: () => void;
}

export const CritiquePanel: React.FC<CritiquePanelProps> = ({
  critique,
  personaName,
  personaEmoji,
  onSave,
  isSaved,
  onStartDebate,
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diagnostics" | "alternatives">("diagnostics");
  const [expandedSection, setExpandedSection] = useState<string | null>("blind");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700 border-emerald-200 bg-emerald-50/50";
    if (score >= 50) return "text-amber-700 border-amber-200 bg-amber-50/50";
    return "text-rose-700 border-rose-200 bg-rose-50/50";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-600";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-600";
  };

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="critique-report">
      {/* Overview Verdict & Persona */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-4xl filter drop-shadow bg-slate-50 p-2.5 rounded-xl border border-slate-200">{personaEmoji}</span>
            <div>
              <p className="text-xs font-mono text-blue-600 tracking-wider font-semibold uppercase">Nhà phản biện châm biếm</p>
              <h3 className="text-lg font-bold font-display text-slate-900">{personaName}</h3>
            </div>
          </div>
          
          <button
            onClick={onSave}
            className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
              isSaved 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80" 
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-950"
            }`}
          >
            <Award className="w-4 h-4" />
            {isSaved ? "Đã lưu sổ tay" : "Lưu vào Sổ tay"}
          </button>
          
          <button
            onClick={() => {
              const mdText = `## Báo cáo Phản biện: ${personaName}\n\n**Lời phán quyết:**\n${critique.verdict}\n\n**Điểm khả thi:** ${critique.score ? critique.score + "/100" : "N/A"}\n\n**Kế hoạch hành động:**\n${critique.actionPlan?.map(a => "- " + a).join("\n") || "Không có"}\n\n**Câu hỏi mài sắc tối ưu:**\n${critique.reframedVersion}`;
              handleCopy(mdText, "report");
            }}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer"
          >
            {copiedText === "report" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            Xuất Báo cáo
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="inline-block px-2 py-0.5 mb-2.5 text-[10px] font-mono tracking-wider text-rose-700 bg-rose-50 border border-rose-200 rounded-md uppercase font-bold">
              LỜI PHÁN QUYẾT (THE VERDICT)
            </span>
            <p className="text-slate-700 text-sm leading-relaxed italic border-l-2 border-rose-500 pl-4 py-1 whitespace-pre-wrap">
              {critique.verdict}
            </p>
          </div>
          
          {critique.score !== undefined && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className={`text-2xl font-display font-bold px-3 py-1 rounded-lg ${getScoreColor(critique.score)}`}>
                {critique.score}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Điểm Khả thi & Thực tế</h4>
                <p className="text-[11px] text-slate-500">Đánh giá mức độ logic, độ tin cậy và khả năng thực thi tổng thể.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            label: "Độ Sâu Phản Biện", 
            value: critique.scores.criticalDepth, 
            desc: "Khả năng đào sâu cốt lõi vấn đề tránh ngụy biên",
            icon: Flame
          },
          { 
            label: "Tư Duy Khai Phóng", 
            value: critique.scores.creativeSpark, 
            desc: "Khả năng gợi mở góc nhìn mới đột phá",
            icon: Compass
          },
          { 
            label: "Nhất Quán Logic", 
            value: critique.scores.logicalConsistency, 
            desc: "Tính chặt chẽ, không mâu thuẫn hệ thống",
            icon: ShieldAlert
          },
        ].map((score, idx) => (
          <div 
            key={idx} 
            className={`p-5 rounded-2xl border ${getScoreColor(score.value)} flex flex-col justify-between transition-all hover:scale-[1.01] shadow-sm`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-slate-500">{score.label}</span>
              <score.icon className="w-4 h-4 opacity-70" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-3xl font-display font-bold">{score.value}</span>
                <span className="text-xs font-mono opacity-50">/100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(score.value)} rounded-full`}
                  style={{ width: `${score.value}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-snug">{score.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 6 Hats Council View */}
      {critique.sixHats && critique.sixHats.length > 0 && (
        <div className="mt-8 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <span className="p-1.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-lg text-lg">🎩</span>
            <h4 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
              Phiên Họp Hội Đồng 6 Chiếc Mũ
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {critique.sixHats.map((hatInfo, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-start transition-all hover:shadow-md hover:border-slate-300">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
                  <span className="text-xl drop-shadow-sm">{hatInfo.emoji}</span>
                  <span className="font-bold text-[11px] text-slate-800 uppercase tracking-widest">{hatInfo.hat}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {hatInfo.response}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Selector for Diagnosis vs Alternatives */}
      <div className="border-b border-slate-200 flex gap-4 mt-6">
        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`pb-3 text-sm font-semibold transition-all relative border-b-2 cursor-pointer ${
            activeTab === "diagnostics" 
              ? "text-blue-600 border-blue-600" 
              : "text-slate-400 border-transparent hover:text-slate-750"
          }`}
        >
          🔍 Chẩn Đoán Lỗ Hổng Tư Duy
        </button>
        <button
          onClick={() => setActiveTab("alternatives")}
          className={`pb-3 text-sm font-semibold transition-all relative border-b-2 cursor-pointer ${
            activeTab === "alternatives" 
              ? "text-blue-600 border-blue-600" 
              : "text-slate-400 border-transparent hover:text-slate-750"
          }`}
        >
          💎 Phương Án Tiếp Cận mới (Alternative)
        </button>
      </div>

      {/* Diagnosis Tab */}
      {activeTab === "diagnostics" && (
        <div className="space-y-3">
          {/* Section: Blind spots */}
          <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection("blind")}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Điểm Mù Tâm Lý & Giả Định Ngầm</h4>
                  <p className="text-[11px] text-slate-500">Các yếu tố bị bỏ qua hoặc tự suy diễn vô căn cứ</p>
                </div>
              </div>
              {expandedSection === "blind" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {expandedSection === "blind" && (
              <div className="px-5 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 font-sans space-y-2">
                {critique.blindSpots.map((spot, i) => (
                  <div key={i} className="flex gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <span className="text-amber-600 font-mono flex-shrink-0">⚠️ [{i + 1}]</span>
                    <span>{spot}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Logical Fallacies */}
          <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection("fallacy")}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 font-display">Lỗi Logic & Thiên Kiến Nhận Thức</h4>
                  <p className="text-[11px] text-slate-500">Những bẫy lập luận sai lệch, ngộ nhận trong tư duy</p>
                </div>
              </div>
              {expandedSection === "fallacy" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {expandedSection === "fallacy" && (
              <div className="px-5 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 font-sans space-y-2">
                {critique.logicalFallacies.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Không tìm thấy ngụy biện trắng trợn nào. Hệ thống tư duy cơ bản sạch!</p>
                ) : (
                  critique.logicalFallacies.map((fallacy, i) => (
                    <div key={i} className="flex gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="text-rose-600 font-mono flex-shrink-0">🧩 [{i + 1}]</span>
                      <span>{fallacy}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Section: Unintended Consequences */}
          <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection("consequence")}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-lg">
                  <Compass className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Rủi Ro Dây Chuyền & Hệ Quả Tiêu Cực</h4>
                  <p className="text-[11px] text-slate-500">Các tác hại gián tiếp, kịch bản Domino tồi tệ nhất</p>
                </div>
              </div>
              {expandedSection === "consequence" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {expandedSection === "consequence" && (
              <div className="px-5 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 font-sans space-y-2">
                {critique.unintendedConsequences.map((conseq, i) => (
                  <div key={i} className="flex gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <span className="text-sky-600 font-mono flex-shrink-0">🌀 [{i + 1}]</span>
                    <span>{conseq}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alternative Options Tab */}
      {activeTab === "alternatives" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {critique.alternativeOptions.map((alt, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between transition-all hover:border-slate-350 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                  <span className="text-teal-700 text-xs font-mono font-bold">[{idx + 1}] {alt.title}</span>
                </div>
                <p className="text-slate-800 font-semibold text-sm mb-3">"{alt.version}"</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-sans">
                <span className="font-semibold text-teal-800">Vì sao mài bén:</span> {alt.reason}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sharpened Version - Prominent Focus */}
      <div className="relative overflow-hidden bg-white border-2 border-blue-600/30 rounded-2xl p-6 shadow-sm">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute top-3 right-3 text-blue-600">
          <Zap className="w-5 h-5 animate-pulse" />
        </div>

        <div className="mb-4">
          <span className="text-[10px] font-mono tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md font-bold uppercase">
            CÂU HỎI ĐÃ ĐƯỢC MÀI SẮC TỐI ƯU
          </span>
          <p className="text-slate-600 text-xs mt-2.5 font-sans">
            Tôi đã cô đọng, loại bỏ định kiến nhận thức và tăng sức công phá phân tích tối đa cho phát biểu của bạn:
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 flex items-start justify-between gap-4">
          <p className="text-slate-900 font-display font-semibold text-sm md:text-base leading-relaxed select-all">
            "{critique.reframedVersion}"
          </p>
          <button
            onClick={() => handleCopy(critique.reframedVersion, "reframed")}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            title="Copy câu hỏi đã mài sắc"
          >
            {copiedText === "reframed" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <span className="text-[10px] text-slate-505 font-mono leading-relaxed">
            💡 Bạn có thể sao chép câu hỏi này để sử dụng làm prompt cực sắc cho các mô hình AI khác.
          </span>
          
          <button
            onClick={onStartDebate}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase select-none"
          >
            Nghênh chiến trực tiếp ⚔️
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Challenge list -> Debate Trigger */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="text-xs font-mono font-bold tracking-wider text-slate-800 uppercase mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
          <HelpCircle className="w-4 h-4 text-rose-500" />
          Đấu Trường Tư Duy: Thử Thách Trả Lời
        </h4>
        <p className="text-xs text-slate-500 mb-4 font-sans">
          Hãy suy nghĩ về những nghịch lý này. Bạn có thể nhấn 'Nghênh chiến trực tiếp' để tranh luận cùng {personaName} về các vấn đề sau:
        </p>
        
        <div className="space-y-2.5">
          {critique.challengeQuestions.map((q, idx) => (
            <div 
              key={idx} 
              className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed flex gap-3 cursor-pointer hover:border-slate-300 hover:bg-slate-100/50 transition-all"
              onClick={onStartDebate}
            >
              <span className="text-rose-600 font-bold font-mono">Q{idx + 1}.</span>
              <span>{q}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan */}
      {critique.actionPlan && critique.actionPlan.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-6">
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-800 uppercase mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Check className="w-4 h-4 text-emerald-500" />
            Kế Hoạch Hành Động Khắc Phục
          </h4>
          <p className="text-xs text-slate-500 mb-4 font-sans">
            Dựa trên các lỗ hổng đã vạch trần, đây là các bước thực tiễn bạn cần làm ngay lập tức:
          </p>
          <div className="space-y-3">
            {critique.actionPlan.map((action, idx) => (
              <div key={idx} className="flex gap-3 text-xs text-slate-700 leading-relaxed">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                  {idx + 1}
                </div>
                <div className="pt-1">{action}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
