import React, { useState } from "react";
import { SavedQuestion } from "../types";
import { PERSONAS } from "../data/personas";
import { 
  Trash2, 
  Copy, 
  Check, 
  Award, 
  Search, 
  ChevronRight, 
  Calendar, 
  TrendingUp,
  Brain,
  ExternalLink
} from "lucide-react";

interface SavedCollectionProps {
  items: SavedQuestion[];
  onRemove: (id: string) => void;
  onSelect: (item: SavedQuestion) => void;
}

export const SavedCollection: React.FC<SavedCollectionProps> = ({
  items,
  onRemove,
  onSelect,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.improvedText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" id="saved-notebook">
      {/* Top action layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-display text-slate-900">Sổ Tay Lưu Trữ Câu Hỏi Sắc Bén</h3>
          <p className="text-xs text-slate-500 font-sans">
            Tổng hợp {items.length} thành tựu mài giũa tư duy đã được tuyển lựa và lưu trữ.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-xs w-full">
          <span className="absolute left-3 top-2.5 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ khoá..."
            className="w-full bg-white border border-slate-200 text-slate-850 outline-none pl-9 pr-4 py-2 text-xs rounded-xl focus:border-blue-650 transition-all font-sans focus:ring-1 focus:ring-blue-650 shadow-sm"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <Brain className="w-12 h-12 text-slate-400/40 mb-3" />
          <p className="text-sm font-semibold text-slate-700">Chưa có bản ghi nào được lưu</p>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed font-sans">
            Hãy chạy phân tích mài giũa ở Trình Phản Biện và nhấn 'Lưu vào Sổ tay' để lưu các phiên bản xuất sắc tại đây!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const persona = PERSONAS.find(p => p.id === item.advocateType) || PERSONAS[0];
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-350 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group h-fit relative overflow-hidden shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {persona.emoji}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 font-display truncate max-w-[150px]">
                        {item.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => handleCopy(item.improvedText, item.id, e)}
                        className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 rounded-md border border-slate-200 text-[10px] text-slate-650 transition-all flex items-center gap-1 cursor-pointer"
                        title="Copy câu hỏi mài sắc"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(item.id);
                        }}
                        className="p-1 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-450 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        title="Xoá vĩnh viễn"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Symmetrical comparison */}
                  <div className="space-y-3 font-sans">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">BAN ĐẦU:</span>
                      <p className="text-slate-500 text-xs mt-0.5 line-clamp-2 leading-relaxed italic">
                        "{item.originalText}"
                      </p>
                    </div>
                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                      <span className="text-[10px] font-mono font-bold text-blue-700 tracking-wider">MÀI BÉN:</span>
                      <p className="text-slate-900 font-bold text-xs mt-0.5 leading-relaxed">
                        "{item.improvedText}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer parameters */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Độ sâu:</span>
                    <span className="font-mono text-emerald-600 font-bold">{item.scores.criticalDepth}%</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transform group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
