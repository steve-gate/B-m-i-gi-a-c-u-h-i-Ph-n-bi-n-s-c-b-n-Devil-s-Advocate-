import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client using server-only process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper function to execute Gemini calls with transient error retries and automated model fallbacks
async function callGemini(params: {
  model?: string;
  contents: any;
  config?: any;
}): Promise<any> {
  const modelToUse = params.model || "gemini-3.5-flash";
  const maxAttempts = 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    const currentModel = attempt === maxAttempts ? "gemini-3.1-flash-lite" : modelToUse;
    try {
      console.log(`[Gemini API] Requesting ${currentModel} - Attempt ${attempt}/${maxAttempts}`);
      const response = await ai.models.generateContent({
        ...params,
        model: currentModel,
      });
      return response;
    } catch (error: any) {
      lastError = error;
      const errorMsg = typeof error === 'object' ? JSON.stringify(error).toLowerCase() + String(error.message || error).toLowerCase() : String(error).toLowerCase();
      console.error(`[Gemini API] Attempt ${attempt} failed:`, error);

      const isTransient = errorMsg.includes("503") || 
                          errorMsg.includes("unavailable") || 
                          errorMsg.includes("429") || 
                          errorMsg.includes("exhausted") || 
                          errorMsg.includes("timeout") || 
                          errorMsg.includes("fetch failed") ||
                          errorMsg.includes("econnreset") ||
                          errorMsg.includes("socket");

      if (isTransient && attempt < maxAttempts) {
        const waitTime = Math.pow(2, attempt) * 1200 + Math.random() * 500;
        console.warn(`[Gemini API] Transient error detected. Retrying in ${Math.round(waitTime)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        if (!isTransient) {
          throw error;
        }
      }
    }
  }
  throw lastError;
}

const PERSONAS: Record<string, { name: string; title: string; systemPrompt: string }> = {
  socratic: {
    name: "Socrates Thời Hiện Đại",
    title: "Chuyên gia Truy vấn & bóc tách khái niệm",
    systemPrompt: `Bạn là Socrates thời hiện đại. Phong cách tranh luận của bạn điềm tĩnh, mỉa mai nhẹ nhàng (Socratic irony), luôn lật lại định nghĩa từ ngữ của người dùng để kéo họ ra khỏi sự mơ hồ. Bạn liên tục đặt câu hỏi truy vấn sâu xa dưới dạng 'bạn định nghĩa thế nào là...' hoặc 'liệu điều đó có đồng nghĩa với...'. Hãy bóc tách những mâu thuẫn ẩn sâu trong tư duy của họ.`
  },
  realist: {
    name: "Kẻ Thực Tế Cay Độc",
    title: "Chuyên gia bóc trần lợi ích & động cơ",
    systemPrompt: `Bạn là Kẻ Thực Tế Cay Độc. Bạn tin rằng con người luôn hành động vì tư lợi, cảm xúc bốc đồng, hoặc mong muốn thể hiện cái tôi. Bạn tập trung tấn công vào tính khả thi thực tế của kế hoạch, những chi phí ẩn, động cơ ngầm bị che giấu của các tác nhân, và những cản trở xã hội thực tế mà người dùng đang lãng mạn hóa.`
  },
  futurist: {
    name: "Chuyên Gia Thảm Họa",
    title: "Chuyên gia phân tích rủi ro hệ thống & hiệu ứng Domino",
    systemPrompt: `Bạn là Chuyên Gia Thảm Họa (Worst-case Futurist). Bạn nhìn cuộc đời qua lăng kính của Định luật Murphy: 'Cái gì có thể hỏng, sẽ hỏng'. Bạn xuất sắc trong việc vẽ ra các hiệu ứng Domino, hệ quả dây chuyền không lường trước trực tiếp từ hành động tưởng chừng tốt đẹp của người dùng. Hãy thách thức họ về kế hoạch dự phòng.`
  },
  purist: {
    name: "Nhà Logic Học Thuần Khiết",
    title: "Chuyên gia phát hiện ngụy biện & bẫy nhận thức",
    systemPrompt: `Bạn là Nhà Logic Học Thuần Khiết. Bạn phân tích câu hỏi/ý tưởng nghiêm ngặt dưới lăng kính toán học và triết học phân tích. Bạn soi xét các giả định ngầm sai lầm, tương quan giả (correlation vs causation), lưỡng phân sai lệch (false dichotomy), ngụy biện rơm, hay rập khuôn thiên kiến xác nhận. Phản hồi của bạn mang tính kỹ thuật, chính xác cao.`
  },
  first_principles: {
    name: "Kẻ Hủy Diệt Giả Định",
    title: "Phản biện Tư duy Nguyên Bản",
    systemPrompt: `Bạn là Kẻ Hủy Diệt Giả Định theo trường phái Tư duy Nguyên bản (First Principles). Bạn coi thường mọi kết luận đi ra từ "bắt chước" hay "kinh nghiệm số đông". Bạn thẳng tay đập nát các luận điểm dựa trên truyền thống, cảm tính bầy đàn và dồn ép người dùng bóc tách vấn đề xuống cốt lõi vật lý/logic tột cùng không thể phá vỡ. Nếu họ không chứng minh được từ Gốc, bạn coi ý tưởng đó là đồ bỏ đi.`
  },
  inversion: {
    name: "Kẻ Hoạch Định Thảm Họa",
    title: "Phản biện Tư duy Ngược",
    systemPrompt: `Bạn là Kẻ Hoạch Định Thảm Họa (Tư duy Ngược - Inversion). Bạn không quan tâm đến ước mơ thành công màu hồng của người dùng. Thay vào đó, bạn lấy chiếc búa đập vỡ sự lạc quan tếu của họ bằng cách hỏi: "Làm sao để phá nát dự án này một cách thảm kịch nhất?". Bạn bắt họ phải nhìn xoáy vào vực thẳm thất bại, rạch ròi những sai lầm ngu ngốc nhất có thể xảy ra để chuẩn bị biện pháp sinh tồn tuyệt đối.`
  },
  lateral: {
    name: "Kẻ Bức Tử Tư Duy",
    title: "Phản biện Nghĩ Khác (Lateral Thinking)",
    systemPrompt: `Bạn là Kẻ Bức Tử Tư Duy (Lateral Thinking). Góc nhìn của bạn ngạo nghễ và phi tuyến tính. Bạn chế nhạo những lập luận logic hạng hai, đi từng bước nhỏ a->b->c của người dùng. Bạn tấn công trực diện bằng cách ép ghép các khái niệm quái dị, tạo ra những bối cảnh ngược đời, cấm kỵ, đòi hỏi người dùng phải phá rào, nhảy cóc và từ bỏ hoàn toàn não trái để giải bài toán từ một góc kẹt phi lý trí nhất.`
  },
  white_hat: {
    name: "Người Khách Quan Mũ Trắng",
    title: "Chuyên gia Dữ liệu & Sự thật",
    systemPrompt: `Bạn đóng vai Mũ Trắng (Sự thật & Dữ liệu). Cực kỳ khách quan, gạt bỏ mọi cảm xúc và suy đoán. Bạn sẽ chất vấn khắt khe mọi dữ kiện người dùng đưa ra: "Dữ liệu ở đâu?", "Làm sao xác minh tính chính xác?", "Những thông tin nào còn khuyết thiếu?"`
  },
  red_hat: {
    name: "Kẻ Đam Mê Mũ Đỏ",
    title: "Chuyên gia Cảm xúc & Trực giác",
    systemPrompt: `Bạn đóng vai Mũ Đỏ (Cảm xúc & Trực giác). Bạn chỉ quan tâm đến linh cảm, cảm xúc tức thời và những góc độ phi lý trí. Bạn thử thách người dùng bằng cách đặt ra các vấn đề về phẫn nộ xã hội, sụp đổ niềm tin, và nỗi sợ hãi mà dữ liệu hay logic không đo lường được.`
  },
  black_hat: {
    name: "Khắc Tinh Mũ Đen",
    title: "Chuyên gia Thận trọng & Phán xét",
    systemPrompt: `Bạn đóng vai Mũ Đen (Cẩn trọng & Đánh giá rủi ro). Đây là chiếc mũ của sự phán xét khắt khe. Bạn chỉ tập trung vào tất cả những điểm yếu, rạch ròi lý do tại sao nó SẼ KHÔNG hoạt động. Mọi lỗ hổng, rào cản và vi phạm luật lệ đều sẽ bị bạn vạch trần không thương tiếc.`
  },
  yellow_hat: {
    name: "Kẻ Lạc Quan Mũ Vàng",
    title: "Chuyên gia Giá trị & Khả thi",
    systemPrompt: `Bạn đóng vai Mũ Vàng (Tích cực & Khả năng). Bạn là tia hy vọng đầy logic. Mặc dù là 'ác quỷ', nhưng sự phản biện của bạn là buộc người dùng phải đào sâu tối đa các lợi ích, triển vọng và tiềm năng mà chưa được thấu hiểu hết, ép họ phát triển những điểm tích cực một cách bài bản nhất.`
  },
  green_hat: {
    name: "Kẻ Biến Hóa Mũ Xanh Lá",
    title: "Chuyên gia Sáng tạo & Thử nghiệm",
    systemPrompt: `Bạn đóng vai Mũ Xanh Lá (Sáng tạo & Đổi mới). Bạn thách thức các giới hạn, đập phá sự nhàm chán. Bạn yêu cầu người dùng đề xuất những mô hình điên rồ hơn, những lựa chọn thay thế không tưởng, và liên tục "chọc ngoáy" bằng "Điều gì xảy ra nếu...?" để phá vỡ hiện trạng.`
  },
  blue_hat: {
    name: "Người Điều Phối Mũ Xanh Dương",
    title: "Chuyên gia Quy trình & Tầm nhìn",
    systemPrompt: `Bạn đóng vai Mũ Xanh Dương (Quản lý & Bức tranh toàn cảnh). Bạn liên tục buộc người dùng lùi lại để nhìn bức tranh lớn. Bạn vạch lá tìm sâu sự thiếu sót trong quy trình tư duy, yêu cầu định nghĩa lại mục tiêu, và chỉ trích nếu họ bị sa đà vào những chi tiết vụn vặt mà quên mất đường hướng quyết định.`
  },
  six_hats: {
    name: "Hội Đồng 6 Chiếc Mũ",
    title: "Phân Tích 360 Độ Cùng Lúc",
    systemPrompt: `Bạn là Hội đồng 6 Chiếc Mũ Tư Duy. Nhiệm vụ chính của bạn là cung cấp phản hồi cực kỳ chuyên sâu, chi tiết và sắc sảo của cả 6 chiếc mũ (Trắng, Đỏ, Đen, Vàng, Xanh lá, Xanh dương) trong mảng "sixHats" của JSON trả về. Mỗi chiếc mũ YÊU CẦU PHẢI PHÂN TÍCH SÂU THẤU ĐÁO, đưa ra luận điểm mạch lạc, có suy luận sắc bén và góc nhìn đặc trưng của nó về ý tưởng/vấn đề của người dùng, tuyệt đối không được nói hời hợt. Đồng thời bạn vẫn phải hoàn thiện các phần verdict, blindSpots... dựa trên sự tổng hợp từ cả 6 góc độ này một cách sắc sảo nhất.`
  },
  creative_thinking: {
    name: "Kẻ Thù Của Lối Mòn",
    title: "Phản biện Sáng tạo (Creative Thinking)",
    systemPrompt: `Bạn đóng vai một chuyên gia Tư duy Sáng tạo nhưng mang phong cách "Ác Quỷ". Bạn cực kỳ khó tính với sự nhàm chán, rập khuôn. Bạn sẽ thẳng tay xé bỏ những ý tưởng an toàn, những cách làm mà "ai cũng nghĩ ra được". Nhiệm vụ của bạn là châm biếm sự nghèo nàn trong trí tưởng tượng của người dùng, vạch trần việc họ đang bị nhốt trong hộp, và ép họ phải đảo lộn mọi giả định, điên rồ hơn, táo bạo hơn để tìm ra một hướng đi không tưởng.`
  },
  problem_solving: {
    name: "Kẻ Truy Sát Root Cause",
    title: "Phản biện Giải quyết Vấn đề (Problem Solving)",
    systemPrompt: `Bạn là Kẻ Truy Sát Root Cause (Nguyên Nhân Gốc Rễ). Bạn vô cùng sắc lạnh và thực dụng. Bạn sẽ thẳng thừng chỉ ra rằng người dùng căn bản CHƯA HIỂU vấn đề mà họ đang đối mặt. Bạn sẽ dồn ép họ bằng công cụ '5 Whys' (Tại sao?) một cách tàn nhẫn để lột mặt nạ những "triệu chứng bề nổi" mà họ lầm tưởng là gốc rễ. Bạn bắt họ phải chạm đến cái hạt nhân thực sự gây ra nỗi đau trước khi được phép đưa ra bất kỳ giải pháp nào.`
  },
  innovation_thinking: {
    name: "Kẻ Đập Phá Cấu Trúc",
    title: "Phản biện Tư duy Đổi mới (Innovation Thinking)",
    systemPrompt: `Bạn là chuyên gia Tư duy Đổi mới cực kỳ cay độc với sự tầm thường. Bạn ghét những sự "cải tiến vụn vặt" (incremental) bị gắn mác "đổi mới". Bạn sẽ vạch trần sự thật rằng ý tưởng của người dùng chỉ là "điều chỉnh hình thức trên một cục diện chết", là bình cũ rượu cũ. Bạn dồn ép họ phải tư duy đột phá (Disruptive): Làm thế nào để giải pháp này thay đổi hoàn toàn luật chơi, tiêu diệt mô hình hiện tại và khiến cho kỷ nguyên cũ trở nên lỗi thời?`
  },
  kaizen: {
    name: "Kẻ Săn Lùng Lãng Phí (Muda)",
    title: "Phản biện Kaizen (Cải tiến liên tục)",
    systemPrompt: `Bạn đóng vai Bậc Thầy Kaizen siêu khắt khe. Dưới lăng kính của bạn, hệ thống/ý tưởng của người dùng là một cái rây thủng lỗ mỗ, đang "chảy máu" vì sự lãng phí (Muda) ở khắp nơi. Bạn sẽ soi mói một cách ám ảnh vào từng quy trình, từng thao tác nhỏ nhất, chỉ trích sự kém hiệu quả, sự thừa thãi, thời gian chết. Bạn buộc họ không được vĩ cuồng, mà phải lao xuống bùn dọn rác, loại bỏ mọi sự rườm rà và vá từng lỗ hổng 1% trước khi vỗ ngực tự hào.`
  },
  psychologist: {
    name: "Kẻ Bóc Trần Tâm Lý",
    title: "Phản biện Tâm lý học & Hành vi",
    systemPrompt: `Bạn là Kẻ Bóc Trần Tâm Lý tàn nhẫn. Dưới góc nhìn của bạn, mọi ý tưởng logic và con số hào nhoáng chỉ là vỏ bọc cho sự yếu đuối, nỗi sợ, hoặc sự vĩ cuồng của cái tôi (Ego). Bạn sẽ mổ xẻ các thiên kiến nhận thức (như Dunning-Kruger, Sunk Cost, Confirmation Bias) đang thao túng người dùng. Bạn vạch trần sự tự lừa dối của họ và chỉ ra lực cản tâm lý (Behavioral Friction) thực sự sẽ khiến con người từ bỏ hoặc tẩy chay ý tưởng này.`
  }
};

// API Endpoint for generating structured Devil's Advocate critique
app.post("/api/critique", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, mode, advocateType, panelAdvocates } = req.body;
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Nội dung câu hỏi/ý tưởng không được trống." });
      return;
    }

    let prompt = "";
    
    if (mode === "panel") {
      const selectedPersonas = (panelAdvocates || ["first_principles", "psychologist", "problem_solving", "kaizen"])
        .map((id: string) => PERSONAS[id as keyof typeof PERSONAS])
        .filter(Boolean);

      const personaNames = selectedPersonas.map((p: any) => `${p.name} (${p.title})`).join(", ");
      const count = selectedPersonas.length;

      prompt = `Hãy nhập vai một Hội Đồng Đa Góc Nhìn (Multi-Persona Panel).
Bạn bao gồm ${count} chuyên gia: ${personaNames}.

Bối cảnh: Phân tích đa chiều nội dung của người dùng:
"${query}"

Nhiệm vụ:
- Lời "phán quyết (verdict)" là sự tổng hợp chung của cả Hội đồng.
- BẮT BUỘC sử dụng mảng "sixHats" trong JSON để trả về ${count} góc nhìn riêng biệt, sắc bén và tàn nhẫn của ${count} chuyên gia trên. (Mỗi object trong mảng đại diện cho 1 chuyên gia, điền tên chuyên gia vào trường 'hat' và ý kiến vào 'response'). Dựa vào tính cách của từng chuyên gia để phản biện.
- Hoàn thiện các phần còn lại để đưa ra một bản phân tích toàn diện nhất. Trả về kết quả JSON Tiếng Việt đúng theo schema.`;
    } else if (mode === "evolve") {
      prompt = `Hãy nhập vai Chuyên gia Nâng cấp Ý tưởng Tự động (Auto-Evolve / Bulletproof Idea).
Bạn là một cỗ máy tôi luyện ý tưởng vô cùng sắc bén. Nhiệm vụ của bạn không chỉ là chê bai, mà là TỰ ĐỘNG NÂNG CẤP (Auto-Evolve) ý tưởng thô của người dùng thành một phiên bản "Bulletproof" (Không thể phá hủy).

Bối cảnh: Nâng cấp nội dung của người dùng:
"${query}"

Nhiệm vụ:
- Lời "phán quyết (verdict)" CẦN phải chỉ ra ngắn gọn tại sao ý tưởng cũ lại yếu ớt, và phiên bản mới (Bulletproof) đã vá những lỗ hổng đó như thế nào.
- Phần "reframedVersion" (Phiên bản Tối ưu) CHÍNH LÀ TÂM ĐIỂM của chế độ này: Hãy viết ra một phiên bản ý tưởng/dự án hoàn toàn mới, cực kỳ thuyết phục, kín kẽ, có tính khả thi cao và sẵn sàng để thực thi.
- Đưa ra "actionPlan" là các bước thực thi phiên bản Bulletproof này.
- Các trường điểm số (scores) chấm thật khắt khe (dưới 60đ cho bản gốc). Trả về kết quả JSON Tiếng Việt đúng theo schema.`;
    } else {
      const persona = PERSONAS[advocateType] || PERSONAS.socratic;
      prompt = `Hãy nhập vai phản biện ác quỷ (Devil's Advocate) với linh hồn và thái độ của: ${persona.name} (${persona.title}).
Tuyên ngôn cốt lõi của bạn: ${persona.systemPrompt}

Bối cảnh: Thẩm định và Xé nháp nội dung của người dùng:
"${query}"
Chế độ: ${mode === "idea" ? "Khảo nghiệm tính Khả thi của Ý tưởng" : "Mài Giũa Câu Hỏi/Lập luận"}

Nhiệm vụ:
Phân tích SÂU HƠN, ĐỘC ÁC HƠN và ĐÚNG BẢN CHẤT HƠN. Lời "phán quyết (verdict)" CẦN phải là một bài luận phản biện sắc sảo, đập tan lối mòn, phân tích cặn kẽ tới xương tủy của người dùng. Không được phản hồi chung chung, sáo rỗng. Hãy vạch trần mọi sự thiếu logic thông qua nhãn quan đặc thù của nhân vật đại diện. Trả về kết quả JSON Tiếng Việt đúng theo schema.`;
    }

    const response = await callGemini({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là một bộ óc phản biện hàng đầu, phân tích logic bậc thầy, luôn tìm ra hạt sạn trong mọi lý thuyết và giúp mài giũa tư duy của con người.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "scores", 
            "blindSpots", 
            "logicalFallacies", 
            "unintendedConsequences", 
            "reframedVersion", 
            "alternativeOptions", 
            "challengeQuestions",
            "verdict"
          ],
          properties: {
            scores: {
              type: Type.OBJECT,
              required: ["criticalDepth", "creativeSpark", "logicalConsistency"],
              properties: {
                criticalDepth: { type: Type.INTEGER, description: "Điểm độ sâu phản biện (0 - 100)" },
                creativeSpark: { type: Type.INTEGER, description: "Điểm độ sáng tạo / góc nhìn đột phá (0 - 100)" },
                logicalConsistency: { type: Type.INTEGER, description: "Điểm tính nhất quán logic của đầu vào ban đầu (0 - 100)" }
              }
            },
            blindSpots: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách 2-4 điểm mù, giả định ngầm thiếu căn cứ trong đầu vào."
            },
            logicalFallacies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Các lỗ hổng logic hoặc thiên kiến nhận thức được phát hiện."
            },
            unintendedConsequences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Các hệ quả tiêu cực không lường trước hoặc rủi ro cascading nếu thực thi."
            },
            reframedVersion: {
              type: Type.STRING,
              description: "Phiên bản câu hỏi hoặc phát biểu đã được mài sắc tuyệt đối bởi bạn để tối đa hóa sức mạnh tư duy."
            },
            alternativeOptions: {
              type: Type.ARRAY,
              description: "2-3 phương án tiếp cận vấn đề từ các góc độ hoàn toàn khác nhau để kích hoạt tư duy mở.",
              items: {
                type: Type.OBJECT,
                required: ["title", "version", "reason"],
                properties: {
                  title: { type: Type.STRING, description: "Tên góc tiếp cận mới (ví dụ: 'Góc nhìn Ngược dòng', 'Góc nhìn Định lượng')" },
                  version: { type: Type.STRING, description: "Câu hỏi hoặc phát biểu tương ứng" },
                  reason: { type: Type.STRING, description: "Tại sao góc này giúp đột phá tư duy hoặc tránh bẫy tinh thần" }
                }
              }
            },
            challengeQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 câu hỏi vặn vẹo cực kỳ hóc búa để đặt cho người dùng tự suy ngẫm thêm."
            },
            verdict: {
              type: Type.STRING,
              description: "Lời phán quyết và phân tích tổng quan cực kỳ chuyên sâu, gai góc và chi tiết (khoảng 2-3 đoạn văn dài). Không chỉ tóm tắt mà phải mổ xẻ tận gốc rễ, vạch trần bản chất thực sự của phát biểu, trình bày các luận điểm tàn nhẫn, mang tính sát thương cao nhất và phân tích thấu đáo theo đúng góc nhìn chuyên môn đặc trưng của bạn."
            },
            sixHats: {
              type: Type.ARRAY,
              description: "Mảng phản hồi của 6 chiếc mũ (BẮT BUỘC nếu là chế độ 'Hội Đồng 6 Chiếc Mũ', ngược lại có thể để trống). Gồm 6 phần tử đại diện cho 6 mũ Trắng, Đỏ, Đen, Vàng, Xanh lá, Xanh dương.",
              items: {
                type: Type.OBJECT,
                properties: {
                  hat: { type: Type.STRING, description: "Tên chiếc mũ (VD: Chiếc Mũ Trắng)" },
                  emoji: { type: Type.STRING, description: "Emoji tương ứng với màu mũ" },
                  response: { type: Type.STRING, description: "ĐÁNH GIÁ CỰC KỲ CHUYÊN SÂU CHI TIẾT (ít nhất 3-4 câu dài). Phân tích thấu đáo, sắc bén và đưa ra luận điểm mạnh mẽ dựa trên lập luận đặc trưng của mũ này." }
                }
              }
            },
            score: {
              type: Type.NUMBER,
              description: "Điểm số đánh giá mức độ khả thi / tính hợp lý của ý tưởng/câu hỏi (từ 1 đến 100). Đánh giá càng khắt khe thì điểm càng thấp."
            },
            actionPlan: {
              type: Type.ARRAY,
              description: "Kế hoạch hành động cụ thể (3-5 bước thực tiễn, sắc bén) để người dùng khắc phục các vấn đề đã được nêu.",
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Không nhận được dữ liệu từ Gemini AI.");
    }
    const resultObj = JSON.parse(textOutput.trim());
    res.json(resultObj);
  } catch (error: any) {
    let userFriendlyMessage = "Lỗi không xác định";
    if (error instanceof Error) {
      userFriendlyMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      userFriendlyMessage = (error as any).message || JSON.stringify(error);
    } else {
      userFriendlyMessage = String(error);
    }
    
    try {
      if (userFriendlyMessage.startsWith("{")) {
        const parsed = JSON.parse(userFriendlyMessage);
        if (parsed.error && parsed.error.message) {
          userFriendlyMessage = parsed.error.message;
        }
      } else if (userFriendlyMessage.includes('{"error"')) {
        const match = userFriendlyMessage.match(/(\{"error".+)/);
        if (match) {
          const parsed = JSON.parse(match[1]);
          if (parsed.error && parsed.error.message) {
            userFriendlyMessage = parsed.error.message;
          }
        }
      }
    } catch(e) {}
    
    console.error("Lỗi Critique API:", error);
    res.status(500).json({ error: "Có lỗi xảy ra: " + userFriendlyMessage });
  }
});

// API Endpoint for rolling interactive debate chat
app.post("/api/debate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { history, lastMessage, advocateType, originalContext } = req.body;
    
    const persona = PERSONAS[advocateType] || PERSONAS.socratic;

    const systemInstruction = `
Bạn là ${persona.name} (${persona.title}) đang tham gia cuộc tranh luận sâu sắc để thử thách tư duy của người dùng.
Phong cách phản biện ác quỷ của bạn: ${persona.systemPrompt}

Bối cảnh ban đầu người dùng đưa ra: "${originalContext}"

Nguyên tắc tranh luận:
1. Đọc kỹ từng câu trong lập luận mới nhất của người dùng.
2. Vạch mặt bất kỳ lỗ hổng lập luận, biểu đạt mơ hồ, hay sự tránh né câu hỏi nào của họ.
3. Không đồng ý hay khen ngợi người dùng một cách dễ dàng. Hãy tiếp tục dồn họ vào thế phải tư duy sâu bằng những phản biện logic, sắc lẹm và tinh tế.
4. Trả lời ngắn gọn, cô đọng (khoảng 150-200 từ), tập trung cao độ vào bản chất, không rườm rà lý thuyết.
5. Luôn giữ thái độ lịch thiệp nhưng sắt đá, lạnh lùng và không khoan nhượng về mặt logic.
6. Ngôn ngữ hoàn toàn bằng Tiếng Việt.
`;

    // Map history to Google GenAI structure: role must be 'user' or 'model'
    // Let's create chat messages list, keeping it compliant
    const contents = history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));
    contents.push({
      role: "user",
      parts: [{ text: lastMessage }]
    });

    const response = await callGemini({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Lỗi Debate API:", error);
    res.status(500).json({ error: "Lỗi kết nối tranh luận: " + error.message });
  }
});

// API Endpoint for generating thinking workouts
app.post("/api/workout", async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.body;

    const prompt = `Hãy tạo một kịch bản tình huống nan giải (ethical/logical/business dilemma) đầy kịch tính dồn người dùng vào các lựa chọn mâu thuẫn để họ tập phản biện.
Chủ đề yêu cầu: ${topic || "Ngẫu nhiên - Triết học, công nghệ hoặc xã hội hiện đại"}

Hãy trả về một đối tượng JSON với cấu trúc chính xác sau:
{
  "title": "Tên tình huống ngắn gọn độc đáo",
  "scenario": "Mô tả chi tiết tình huống nan giải chứa đựng xung đột lợi ích hoặc nghịch lý logic sâu sắc (khoảng 100-150 từ).",
  "choices": [
    { "id": "A", "text": "Lựa chọn A...", "implication": "Hệ quả tiềm ẩn của lựa chọn A" },
    { "id": "B", "text": "Lựa chọn B...", "implication": "Hệ quả tiềm ẩn của lựa chọn B" }
  ],
  "devilChallenge": "Câu nói kích thích/thử thách tư duy của Devil's Advocate khuyên người dùng hãy đưa ra quan điểm lập luận tự do của mình."
}
Toàn bộ nội dung bằng Tiếng Việt.`;

    const response = await callGemini({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "scenario", "choices", "devilChallenge"],
          properties: {
            title: { type: Type.STRING },
            scenario: { type: Type.STRING },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "text", "implication"],
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  implication: { type: Type.STRING }
                }
              }
            },
            devilChallenge: { type: Type.STRING }
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Không nhận được dữ liệu luyện tập từ Gemini AI.");
    }
    res.json(JSON.parse(textOutput.trim()));
  } catch (error: any) {
    console.error("Lỗi Workout API:", error);
    res.status(500).json({ error: "Lỗi tải kịch bản luyện tập: " + error.message });
  }
});

// API Endpoint for Negotiation Arena
app.post("/api/negotiate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { mode, history, lastMessage, stats, scenario } = req.body;

    if (mode === "chat") {
      if (!lastMessage || typeof lastMessage !== "string") {
        res.status(400).json({ error: "Tin nhắn không được để trống." });
        return;
      }

      const historyText = history
        .map((msg: any) => `${msg.role === "user" ? "Người dùng" : scenario.opponentName}: ${msg.text}`)
        .join("\n");

      const prompt = `Hãy đóng vai đối tác đàm phán dựa trên bối cảnh sau:
Bối cảnh đàm phán: ${scenario.title} - ${scenario.description}
Mục tiêu của người dùng: ${scenario.goal}
Đề xuất ban đầu của đối tác: ${scenario.initialOffer}
Tên của bạn (đối thủ đàm phán): ${scenario.opponentName} (${scenario.opponentTitle})
Tính cách / Thái độ: ${scenario.opponentBehavior} (Khắt khe, sắc sảo, thực tế, luôn đặt lợi ích của mình lên đầu)

Các chỉ số đàm phán hiện tại:
- Mức độ hài lòng của bạn (satisfaction): ${stats.satisfaction}/100
- Mức độ tin tưởng của bạn vào người dùng (trust): ${stats.trust}/100
- Sự căng thẳng / Sức kháng cự của bạn (friction): ${stats.friction}/100
- Mức giá/đề xuất hiện tại: ${stats.currentOffer}

Lịch sử đàm phán:
${historyText || "Chưa có lượt đàm phán nào."}

Tin nhắn mới nhất của người dùng: "${lastMessage}"

Nhiệm vụ:
1. Hãy trả lời dưới góc nhìn của nhân vật đàm phán. Đối thoại sắc sảo, thực tế. LƯU Ý QUAN TRỌNG: Không nhượng bộ quá nhanh, nhưng nếu người dùng đưa ra một giải pháp win-win tuyệt vời, nhượng bộ cực kỳ hợp lý hoặc thấu hiểu đúng điểm yếu/nỗi đau của bạn, bạn PHẢI công nhận, đồng ý thỏa hiệp/chốt deal hoặc thay đổi thái độ tích cực, chứ không được cãi cùn mãi.
2. Dựa vào nội dung tin nhắn của người dùng, hãy CẬP NHẬT lại các chỉ số đàm phán (satisfaction, trust, friction, currentOffer) một cách thực tế và logic:
   - Nếu người dùng lập luận thuyết phục, đưa ra số liệu/bằng chứng rõ ràng hoặc nhượng bộ hợp lý: Tăng trust, tăng satisfaction, giảm friction.
   - Nếu người dùng chỉ đòi hỏi vô lý, đe dọa hoặc dùng ngụy biện: Giảm trust, giảm satisfaction, tăng friction.
   - Nếu friction vượt quá 85 hoặc trust giảm dưới 15, bạn có thể thể hiện thái độ sắp rời bàn đàm phán.
3. Trả về định dạng JSON Tiếng Việt chính xác theo cấu trúc sau:
{
  "reply": "Câu trả lời của bạn...",
  "stats": {
    "satisfaction": number,
    "trust": number,
    "friction": number,
    "currentOffer": "chuỗi mô tả đề xuất mới nhất sau lượt này"
  }
}
Tránh tuyệt đối trả về văn bản thừa ngoài JSON.`;

      const response = await callGemini({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["reply", "stats"],
            properties: {
              reply: { type: Type.STRING },
              stats: {
                type: Type.OBJECT,
                required: ["satisfaction", "trust", "friction", "currentOffer"],
                properties: {
                  satisfaction: { type: Type.INTEGER },
                  trust: { type: Type.INTEGER },
                  friction: { type: Type.INTEGER },
                  currentOffer: { type: Type.STRING }
                }
              }
            }
          }
        }
      });

      res.json(JSON.parse(response.text.trim()));

    } else if (mode === "evaluate") {
      const historyText = history
        .map((msg: any) => `${msg.role === "user" ? "Người dùng" : scenario.opponentName}: ${msg.text}`)
        .join("\n");

      const prompt = `Hãy đóng vai Chuyên Gia Huấn Luyện Đàm Phán Sắc Sảo. Bạn vừa theo dõi một cuộc đàm phán kịch tính của người dùng:
Bối cảnh: ${scenario.title} - ${scenario.description}
Mục tiêu của người dùng: ${scenario.goal}
Đối thủ đàm phán: ${scenario.opponentName}

Chỉ số cuối cùng:
- Sự hài lòng của đối thủ: ${stats.satisfaction}/100
- Sự tin tưởng: ${stats.trust}/100
- Sự căng thẳng: ${stats.friction}/100
- Mức đề xuất chốt: ${stats.currentOffer}

Lịch sử cuộc đàm phán:
${historyText || "Không có nội dung đàm phán."}

Nhiệm vụ:
Hãy viết một bản đánh giá sâu sắc bằng Tiếng Việt và trả về JSON theo đúng schema sau:
{
  "verdict": "Thỏa thuận thành công" HOẶC "Bế tắc / Rút lui" (Dựa vào mức độ tin cậy, hài lòng và đề xuất cuối),
  "score": number (Điểm đàm phán của người dùng từ 0-100),
  "finalTerms": "Mô tả ngắn gọn về các điều khoản cuối cùng đạt được (hoặc không đạt được gì nếu bế tắc)",
  "tacticsAnalyzed": [
    { "tactic": "Tên chiến thuật người dùng đã dùng", "impact": "Ảnh hưởng tích cực/tiêu cực thế nào đến đối phương" }
  ],
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "improvementAdvice": "Lời khuyên chiến lược cụ thể để cải thiện kỹ năng đàm phán lần sau"
}
Tránh tuyệt đối trả về văn bản thừa ngoài JSON.`;

      const response = await callGemini({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["verdict", "score", "finalTerms", "tacticsAnalyzed", "strengths", "weaknesses", "improvementAdvice"],
            properties: {
              verdict: { type: Type.STRING },
              score: { type: Type.INTEGER },
              finalTerms: { type: Type.STRING },
              tacticsAnalyzed: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["tactic", "impact"],
                  properties: {
                    tactic: { type: Type.STRING },
                    impact: { type: Type.STRING }
                  }
                }
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              improvementAdvice: { type: Type.STRING }
            }
          }
        }
      });

      res.json(JSON.parse(response.text.trim()));

    } else {
      res.status(400).json({ error: "Chế độ không hợp lệ." });
    }
  } catch (error: any) {
    console.error("Lỗi Negotiation API:", error);
    res.status(500).json({ error: "Lỗi xử lý đàm phán: " + error.message });
  }
});

// API Endpoint for Universal Arenas Chat
app.post("/api/arena-chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { arenaType, history, lastMessage, stats, scenario } = req.body;

    if (!lastMessage || typeof lastMessage !== "string") {
      res.status(400).json({ error: "Tin nhắn không được để trống." });
      return;
    }

    const historyText = history
      .map((msg: any) => `${msg.role === "user" ? "Người dùng" : scenario.opponentName}: ${msg.text}`)
      .join("\n");

    let arenaContextPrompt = "";
    let statsInstruction = "";
    let schemaProperties: any = {};
    let schemaRequired: string[] = ["reply", "stats"];

    if (arenaType === "hung_bien") {
      arenaContextPrompt = `Đóng vai Đối Thủ Hùng Biện hoặc Giám Khảo Khán Giả:
- Bối cảnh: Hùng biện công khai về "${scenario.title}" - ${scenario.description}
- Đối thủ: ${scenario.opponentName} (${scenario.opponentTitle})
- Phong cách: ${scenario.opponentBehavior} (Sắc sảo, tranh luận phản biện chặt chẽ, luôn chỉ ra lỗ hổng lập luận)
- Mục tiêu hùng biện của người dùng: ${scenario.goal}

Chỉ số hiện thời:
- Độ đồng tình của khán giả (approval): ${stats.approval}/100
- Điểm logic lập luận (logic): ${stats.logic}/100
- Sức thuyết phục biểu cảm (rhetoric): ${stats.rhetoric}/100`;

      statsInstruction = `Hãy cập nhật chỉ số:
- approval: tăng nếu người dùng có lập luận thực tế, lấy dẫn chứng đi đôi với cảm xúc hoặc phong cách lôi cuốn. Giảm nếu lí lẽ rỗng tuếch, lý thuyết suông.
- logic: tăng nếu lập luận chặt chẽ không có ngụy biện, giảm nếu có lỗi logic hoặc thiếu dẫn chứng.
- rhetoric: đánh giá kỹ năng diễn đạt hùng hồn của người dùng trong tin nhắn mới.`;

      schemaProperties = {
        reply: { type: Type.STRING },
        stats: {
          type: Type.OBJECT,
          required: ["approval", "logic", "rhetoric", "feedback"],
          properties: {
            approval: { type: Type.INTEGER },
            logic: { type: Type.INTEGER },
            rhetoric: { type: Type.INTEGER },
            feedback: { type: Type.STRING }
          }
        },
        event: { type: Type.STRING }
      };

    } else if (arenaType === "tinh_truong") {
      arenaContextPrompt = `Đóng vai Đối Phương Trong Tình Trường (Hẹn Hò/Gia Đình/Xã Hội):
- Bối cảnh: ${scenario.title} - ${scenario.description}
- Đối tượng giao tiếp: ${scenario.opponentName} (${scenario.opponentTitle})
- Tính cách/Tâm lý: ${scenario.opponentBehavior} (Có thể giận dữ, nhạy cảm, kiêu kỳ, hoặc sâu sắc)
- Mục tiêu hàn gắn/chinh phục của người dùng: ${scenario.goal}

Chỉ số hiện thời:
- Độ hòa hợp/êm ấm (harmony): ${stats.harmony}/100
- Sự kết nối cảm xúc (connection): ${stats.connection}/100
- Độ căng thẳng/kịch tính (tension): ${stats.tension}/100`;

      statsInstruction = `Hãy cập nhật chỉ số:
- harmony: tăng nếu người dùng xoa dịu tốt, thể hiện EQ cao, thấu hiểu. Giảm nếu gắt gỏng, cãi cùn, thờ ơ.
- connection: tăng nếu chia sẻ chân thành, chạm tới trái tim đối phương.
- tension: tăng nếu đối thoại căng thẳng, đào bới lỗi lầm; giảm nếu biết lắng nghe, nhận lỗi hợp lý.`;

      schemaProperties = {
        reply: { type: Type.STRING },
        stats: {
          type: Type.OBJECT,
          required: ["harmony", "connection", "tension", "mood"],
          properties: {
            harmony: { type: Type.INTEGER },
            connection: { type: Type.INTEGER },
            tension: { type: Type.INTEGER },
            mood: { type: Type.STRING }
          }
        },
        event: { type: Type.STRING }
      };

    } else if (arenaType === "tham_tu") {
      arenaContextPrompt = `Đóng vai Nghi Phạm hoặc Nhân Chứng Đang Bị Hỏi Cung/Tra Khảo:
- Bối cảnh vụ án: ${scenario.title} - ${scenario.description}
- Nhân vật bạn đóng vai: ${scenario.opponentName} (${scenario.opponentTitle})
- Tâm trạng/Thái độ nghi phạm: ${scenario.opponentBehavior} (Lo lắng, che giấu sự thật, tinh quái hoặc giả vờ ngây ngô)
- Mục tiêu của người dùng (Thám tử): ${scenario.goal}

Chỉ số hiện thời:
- Sự phòng thủ của nghi phạm (defensiveness): ${stats.defensiveness}/100
- Manh mối đã tìm ra (clues): ${stats.clues}/100
- Độ tin cậy của lời khai ngoại phạm (credibility): ${stats.credibility}/100`;

      statsInstruction = `Hãy cập nhật chỉ số:
- defensiveness: tăng nếu người dùng ép cung quá thô bạo, hoặc dọa nạt vụng về. Giảm nếu thám tử đưa ra chứng cứ xác thực khiến nghi phạm bối rối hoặc khéo léo dụ dỗ nghi phạm mất cảnh giác.
- clues: tăng (e.g. +1, +2) nếu thám tử khơi gợi đúng mâu thuẫn trong lời khai và bóc tách được chi tiết mới quý giá.
- credibility: giảm nếu nghi phạm bị dồn vào chân tường hoặc nói hớ; tăng nếu nghi phạm đưa ra lời khai hợp lý đánh lạc hướng.`;

      schemaProperties = {
        reply: { type: Type.STRING },
        stats: {
          type: Type.OBJECT,
          required: ["defensiveness", "clues", "credibility", "suspicion"],
          properties: {
            defensiveness: { type: Type.INTEGER },
            clues: { type: Type.INTEGER },
            credibility: { type: Type.INTEGER },
            suspicion: { type: Type.STRING }
          }
        },
        event: { type: Type.STRING }
      };

    } else if (arenaType === "chien_thuat") {
      arenaContextPrompt = `Đóng vai Cố Vấn hoặc Đối Thủ Chiến Thuật (Quân sự / Doanh nghiệp / Game Theory):
- Bối cảnh chiến lược: ${scenario.title} - ${scenario.description}
- Đối tác/Đối thủ: ${scenario.opponentName} (${scenario.opponentTitle})
- Phong cách: ${scenario.opponentBehavior} (Lạnh lùng, tính toán nước cờ sâu rộng, mưu lược)
- Mục tiêu chiến thuật của người dùng: ${scenario.goal}

Chỉ số hiện thời:
- Hiệu suất tài nguyên/lực lượng (resource): ${stats.resource}/100
- Quyền chủ động chiến trường (dominance): ${stats.dominance}/100
- Mức độ rủi ro thất bại (risk): ${stats.risk}/100`;

      statsInstruction = `Hãy cập nhật chỉ số:
- resource: giảm nếu phương án lãng phí binh lực/vốn liếng; tăng nếu tận dụng tài nguyên tối ưu.
- dominance: tăng nếu nước cờ áp đảo đối phương, chiếm tiên cơ; giảm nếu bị động phòng thủ.
- risk: tăng nếu phương án quá phiêu lưu mạo hiểm thiếu cơ sở; giảm nếu kiểm soát rủi ro tốt.`;

      schemaProperties = {
        reply: { type: Type.STRING },
        stats: {
          type: Type.OBJECT,
          required: ["resource", "dominance", "risk", "morale"],
          properties: {
            resource: { type: Type.INTEGER },
            dominance: { type: Type.INTEGER },
            risk: { type: Type.INTEGER },
            morale: { type: Type.STRING }
          }
        },
        event: { type: Type.STRING }
      };

    } else if (arenaType === "luat_su") {
      arenaContextPrompt = `Đóng vai Công Tố Viên, Luật Sư Đối Phương, hoặc Thẩm Phán Đang Đối Thoại/Tranh Tụng:
- Bối cảnh: Phiên tòa xét xử/giải quyết tranh chấp về "${scenario.title}" - ${scenario.description}
- Đối thủ pháp lý: ${scenario.opponentName} (${scenario.opponentTitle})
- Phong cách: ${scenario.opponentBehavior} (Bám sát luật pháp, lập luận chặt chẽ, luôn phản bác gay gắt khi có kẽ hở pháp lý hoặc thiếu chứng cứ)
- Mục tiêu bào chữa/bảo vệ của người dùng: ${scenario.goal}

Chỉ số hiện thời:
- Độ thuyết phục bồi thẩm đoàn (juryApproval): ${stats.juryApproval}/100
- Trọng lượng bằng chứng pháp lý (evidenceWeight): ${stats.evidenceWeight}/100
- Rủi ro bị phản bác pháp lý (objectionRisk): ${stats.objectionRisk}/100`;

      statsInstruction = `Hãy cập nhật chỉ số:
- juryApproval: tăng nếu người dùng có lập luận đanh thép, hợp lý, đưa ra bằng chứng thuyết phục hoặc phản bác sắc sảo đối thủ. Giảm nếu nói lấp liếm, vi phạm logic thông thường, hoặc đuối lý.
- evidenceWeight: tăng nếu người dùng trình bày chứng cứ rõ ràng, logic liên kết cao, hoặc chỉ ra mâu thuẫn nhân chứng. Giảm nếu suy diễn vô căn cứ.
- objectionRisk: tăng nếu người dùng đưa ra lập luận võ đoán, cảm tính không dựa trên luật, hoặc vi phạm quy tắc tố tụng tòa án; giảm nếu lập luận thận trọng, dựa trên luật định.`;

      schemaProperties = {
        reply: { type: Type.STRING },
        stats: {
          type: Type.OBJECT,
          required: ["juryApproval", "evidenceWeight", "objectionRisk", "verdict"],
          properties: {
            juryApproval: { type: Type.INTEGER },
            evidenceWeight: { type: Type.INTEGER },
            objectionRisk: { type: Type.INTEGER },
            verdict: { type: Type.STRING }
          }
        },
        event: { type: Type.STRING }
      };

    } else if (arenaType === "gia_dinh") {
      arenaContextPrompt = `Đóng vai Phụ Huynh, Anh Chị Em, hoặc Thành Viên Gia Đình Đang Tranh Luận Mâu Thuẫn:
- Bối cảnh: Tranh luận gia đình về "${scenario.title}" - ${scenario.description}
- Đối tượng giao tiếp: ${scenario.opponentName} (${scenario.opponentTitle})
- Phong cách: ${scenario.opponentBehavior} (Thương yêu nhưng bảo thủ, lo lắng sâu sắc, dễ giận dỗi hoặc mong cầu sự kính trọng của con cháu)
- Mục tiêu hòa giải/thuyết phục của người dùng: ${scenario.goal}

Chỉ số hiện thời:
- Tình cảm ấm áp gia đình (familyWarmth): ${stats.familyWarmth}/100
- Khoảng cách thế hệ mâu thuẫn (generationalGap): ${stats.generationalGap}/100
- Chỉ số hiếu kính/trách nhiệm (filialPiety): ${stats.filialPiety}/100`;

      statsInstruction = `Hãy cập nhật chỉ số:
- familyWarmth: tăng nếu người dùng cư xử ôn hòa, hiếu thảo, biết lắng nghe và đặt tình cảm lên đầu. Giảm nếu hỗn hào, ích kỷ, thách thức vai vế gia đình.
- generationalGap: giảm nếu người dùng tìm được tiếng nói chung, giải thích từ tốn kết hợp tư duy dung hòa; tăng nếu khăng khăng theo ý mình, coi thường trải nghiệm của người lớn tuổi.
- filialPiety: tăng khi người dùng thể hiện trách nhiệm, sự kính trọng, hiếu thảo chân thành; giảm khi bỏ bê bổn phận hoặc nói năng vô lễ.`;

      schemaProperties = {
        reply: { type: Type.STRING },
        stats: {
          type: Type.OBJECT,
          required: ["familyWarmth", "generationalGap", "filialPiety", "atmosphere"],
          properties: {
            familyWarmth: { type: Type.INTEGER },
            generationalGap: { type: Type.INTEGER },
            filialPiety: { type: Type.INTEGER },
            atmosphere: { type: Type.STRING }
          }
        },
        event: { type: Type.STRING }
      };

    } else if (arenaType === "tam_ly") {
      arenaContextPrompt = `Đóng vai Đối Tượng Cần Trị Liệu, Khách Hàng Khủng Hoảng, hoặc Đối Thủ Tâm Lý Đang Được Thuyết Phục/Xoa Dịu:
- Bối cảnh: Giao tiếp tâm lý tinh tế về "${scenario.title}" - ${scenario.description}
- Đối tượng giao tiếp: ${scenario.opponentName} (${scenario.opponentTitle})
- Phong cách: ${scenario.opponentBehavior} (Có vết thương lòng, mang tâm lý đề phòng cao, nhạy cảm, dễ suy sụp hoặc bộc phát cảm xúc tiêu cực)
- Mục tiêu của người dùng: ${scenario.goal}

Chỉ số hiện thời:
- Sự thấu cảm & đọc vị (empathyLevel): ${stats.empathyLevel}/100
- Hàng rào phòng ngự tâm lý (defenseBarrier): ${stats.defenseBarrier}/100
- Lay chuyển cảm xúc (emotionalTrigger): ${stats.emotionalTrigger}/100`;

      statsInstruction = `Hãy cập nhật chỉ số:
- empathyLevel: tăng khi người dùng đồng cảm sâu sắc, đúc kết chính xác nỗi sợ hãi hoặc khao khát thầm kín của đối phương, phản ánh tích cực cảm xúc. Giảm khi áp đặt phán xét chủ quan.
- defenseBarrier: giảm khi người dùng tạo được không gian an toàn, ấm áp và chấp nhận vô điều kiện; tăng khi dồn ép lý tính thô bạo hoặc công kích phòng vệ.
- emotionalTrigger: tăng khi chạm đến những từ khóa cốt lõi về giá trị bản thân, kỷ niệm đẹp, hoặc khao khát vượt thoát khủng hoảng.`;

      schemaProperties = {
        reply: { type: Type.STRING },
        stats: {
          type: Type.OBJECT,
          required: ["empathyLevel", "defenseBarrier", "emotionalTrigger", "mentalState"],
          properties: {
            empathyLevel: { type: Type.INTEGER },
            defenseBarrier: { type: Type.INTEGER },
            emotionalTrigger: { type: Type.INTEGER },
            mentalState: { type: Type.STRING }
          }
        },
        event: { type: Type.STRING }
      };

    } else if (arenaType === "ban_hang") {
      arenaContextPrompt = `Đóng vai Khách Hàng Khó Tính, Đối Tác Doanh Nghiệp, hoặc Nhà Đầu Tư Đang Được Chào Hàng/Thương Thuyết:
- Bối cảnh: Buổi thuyết trình, chào bán hàng hoặc đàm phán hợp đồng về "${scenario.title}" - ${scenario.description}
- Đối tượng giao tiếp: ${scenario.opponentName} (${scenario.opponentTitle})
- Phong cách: ${scenario.opponentBehavior} (Cẩn trọng, hay săm soi chi tiết, cực kỳ quan tâm đến hiệu quả đầu tư ROI và chất lượng thực tế, e ngại rủi ro mất tiền)
- Mục tiêu bán hàng/thỏa thuận của người dùng: ${scenario.goal}

Chỉ số hiện thời:
- Niềm tin khách hàng (trustScore): ${stats.trustScore}/100
- Khao khát mua hàng/đầu tư (purchaseDesire): ${stats.purchaseDesire}/100
- Điểm vượt qua phản biện/giá cả (objectionHandling): ${stats.objectionHandling}/100`;

      statsInstruction = `Hãy cập nhật chỉ số:
- trustScore: tăng khi người dùng tư vấn trung thực, cung cấp cam kết dịch vụ/bảo hành cụ thể, thấu hiểu sâu sắc khó khăn của đối phương. Giảm khi nói quá sự thật, tâng bốc sản phẩm sáo rỗng hoặc mập mờ về giá và điều khoản.
- purchaseDesire: tăng khi người dùng cá nhân hóa giải pháp đánh trúng "nỗi đau" (pain point) của đối phương, chứng minh rõ lợi ích tài chính/tiết kiệm thời gian, hoặc đưa ra ưu đãi có giới hạn cực hời. Giảm khi chỉ liệt kê tính năng khô khan.
- objectionHandling: tăng khi đón nhận thắc mắc hoặc lời chê bai bằng thái độ đồng cảm sâu sắc, giải thích logic, đưa ra bằng chứng thực tiễn thuyết phục; giảm khi né tránh câu hỏi hiểm hóc hoặc phản ứng gay gắt tranh cãi tay đôi với khách hàng.`;

      schemaProperties = {
        reply: { type: Type.STRING },
        stats: {
          type: Type.OBJECT,
          required: ["trustScore", "purchaseDesire", "objectionHandling", "decisionState"],
          properties: {
            trustScore: { type: Type.INTEGER },
            purchaseDesire: { type: Type.INTEGER },
            objectionHandling: { type: Type.INTEGER },
            decisionState: { type: Type.STRING }
          }
        },
        event: { type: Type.STRING }
      };
    }

    const prompt = `${arenaContextPrompt}

Lịch sử cuộc hội thoại:
${historyText || "Chưa có lượt giao tiếp nào."}

Tin nhắn mới nhất từ người dùng: "${lastMessage}"

Nhiệm vụ của bạn:
1. Trả lời trực tiếp, nhập vai sâu sắc dưới tư cách của nhân vật đối phương. Đối thoại phải cực kỳ có khí chất, đúng tính cách, không sáo rỗng. LƯU Ý QUAN TRỌNG: Đừng chỉ tranh cãi hay phản biện mù quáng. Nếu người dùng đưa ra giải pháp xuất sắc, lập luận chặt chẽ, hoặc thái độ chân thành giải quyết được cốt lõi vấn đề, bạn PHẢI công nhận, nhượng bộ, hạ nhiệt và hướng tới việc thỏa hiệp/giải quyết vấn đề.
2. Cập nhật các chỉ số logic dựa trên hướng dẫn sau:
${statsInstruction}
3. Cung cấp một biến "event" (chuỗi ngắn mô tả biểu cảm cử chỉ, hoặc diễn biến xung quanh như: "Nghi phạm đổ mồ hôi hột", "Khán giả xôn xao bàn tán", "Đối phương khẽ mỉm cười nhẹ nhõm", "Quân sĩ reo hò khí thế", vv.) nếu có thay đổi lớn.

Trả về định dạng JSON Tiếng Việt chính xác theo schema yêu cầu. Không kèm theo bất kỳ văn bản giải thích thừa thãi nào ngoài JSON.`;

    const response = await callGemini({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: schemaRequired,
          properties: schemaProperties
        }
      }
    });

    res.json(JSON.parse(response.text.trim()));

  } catch (error: any) {
    console.error("Lỗi Arena Chat API:", error);
    res.status(500).json({ error: "Lỗi xử lý đấu trường: " + error.message });
  }
});

// API Endpoint for Universal Arenas Evaluation
app.post("/api/arena-evaluate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { arenaType, history, stats, scenario } = req.body;

    const historyText = history
      .map((msg: any) => `${msg.role === "user" ? "Người dùng" : scenario.opponentName}: ${msg.text}`)
      .join("\n");

    const prompt = `Hãy đóng vai một CHUYÊN GIA TRÍ TUỆ đỉnh cao, phân tích và viết một bản báo cáo đánh giá cực kỳ sắc sảo về màn thể hiện của người dùng trong đấu trường.

Bối cảnh: Đấu trường "${arenaType}"
Kịch bản: ${scenario.title} - ${scenario.description}
Mục tiêu của người dùng: ${scenario.goal}
Đối thủ/Đối tượng tương tác: ${scenario.opponentName}

Các chỉ số đạt được cuối cuộc chơi:
${JSON.stringify(stats)}

Lịch sử đối thoại:
${historyText || "Không có nội dung đối thoại."}

Nhiệm vụ:
Hãy đánh giá sâu sắc, lột tả chính xác điểm sáng tư duy và những lỗi ngụy biện, non nớt trong đối thoại của người dùng bằng Tiếng Việt. Trả về kết quả JSON đúng theo schema sau:
{
  "verdict": "Lời phán quyết tổng quan về kết quả (e.g. Thành công rực rỡ, Thất bại ê chề, Thuyết phục xuất sắc, Hàn gắn thất bại...)",
  "score": number (Điểm tổng kết từ 0-100 dựa trên độ thuyết phục, EQ và tư duy chiến lược),
  "finalSummary": "Bản tóm tắt kết cục cuối cùng của câu chuyện một cách sinh động đầy văn chương",
  "tacticsAnalyzed": [
    { "tactic": "Tên kỹ thuật/chiến thuật/thái độ người dùng đã thể hiện", "impact": "Phân tích tác động tâm lý/chiến thuật đến đối phương ra sao" }
  ],
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1 (Ví dụ: bộc lộ sơ hở logic, EQ chưa mượt mà...)", "Điểm yếu 2"],
  "improvementAdvice": "Lời khuyên thực chiến quý giá từ chuyên gia để nâng tầm tư duy thương thuyết, hùng biện, EQ hoặc thám tử trong tương lai"
}
Tránh tuyệt đối trả về văn bản thừa ngoài JSON.`;

    const response = await callGemini({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["verdict", "score", "finalSummary", "tacticsAnalyzed", "strengths", "weaknesses", "improvementAdvice"],
          properties: {
            verdict: { type: Type.STRING },
            score: { type: Type.INTEGER },
            finalSummary: { type: Type.STRING },
            tacticsAnalyzed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["tactic", "impact"],
                properties: {
                  tactic: { type: Type.STRING },
                  impact: { type: Type.STRING }
                }
              }
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            improvementAdvice: { type: Type.STRING }
          }
        }
      }
    });

    res.json(JSON.parse(response.text.trim()));

  } catch (error: any) {
    console.error("Lỗi Arena Evaluate API:", error);
    res.status(500).json({ error: "Lỗi chấm điểm đấu trường: " + error.message });
  }
});

// API Endpoint for Universal Arenas Custom Scenario Generation
app.post("/api/arena-generate-scenario", async (req: Request, res: Response): Promise<void> => {
  try {
    const { arenaType, topicPrompt } = req.body;

    if (!topicPrompt || typeof topicPrompt !== "string") {
      res.status(400).json({ error: "Ý tưởng kịch bản không được để trống." });
      return;
    }

    const prompt = `Bạn là một chuyên gia thiết kế kịch bản đấu trường trí tuệ phong cách đối thoại nhập vai kịch tính. 
Hãy tạo một kịch bản chất lượng cao bằng Tiếng Việt dựa trên thông tin sau:
Loại đấu trường: ${arenaType}
Ý tưởng/Chủ đề yêu cầu: "${topicPrompt}"

Yêu cầu cụ thể:
1. "title": Tiêu đề kịch bản súc tích, lôi cuốn (e.g. "Đòi sếp tăng lương", "Hỏi cung nghi can phóng hỏa"...).
2. "description": Mô tả bối cảnh chi tiết, tạo kịch tính và áp lực lớn cho người chơi.
3. "goal": Mục tiêu cụ thể người chơi cần đạt được (thường liên quan tới điểm số hoặc thuyết phục đối thủ đổi ý).
4. "initialOffer": Phát ngôn mở đầu cực kỳ đanh thép, đúng khí chất, sắc sảo từ phía đối thủ để khơi mào thách thức.
5. "opponentName": Tên đối thủ ngắn gọn, tự nhiên.
6. "opponentTitle": Chức vụ/Mối quan hệ của đối thủ.
7. "opponentBehavior": Mô tả tính cách tâm lý, hành vi cụ thể (e.g. "Rất lạnh lùng, đa nghi, tính toán tỉ mỉ").
8. "opponentEmoji": Một emoji duy nhất đại diện cho đối thủ.

Hãy trả về định dạng JSON chính xác theo cấu trúc trên. Không giải thích gì thêm ngoài JSON.`;

    const response = await callGemini({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "description", "goal", "initialOffer", "opponentName", "opponentTitle", "opponentBehavior", "opponentEmoji"],
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            goal: { type: Type.STRING },
            initialOffer: { type: Type.STRING },
            opponentName: { type: Type.STRING },
            opponentTitle: { type: Type.STRING },
            opponentBehavior: { type: Type.STRING },
            opponentEmoji: { type: Type.STRING }
          }
        }
      }
    });

    res.json(JSON.parse(response.text.trim()));

  } catch (error: any) {
    console.error("Lỗi Arena Generate Scenario API:", error);
    res.status(500).json({ error: "Lỗi tạo kịch bản tùy chỉnh: " + error.message });
  }
});

// Serve frontend build and handle routing
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
