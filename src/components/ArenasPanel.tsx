import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Megaphone, 
  Heart, 
  Search, 
  Shield, 
  Award, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  MessageSquare,
  Flame,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Check,
  Plus,
  Trash2
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "opponent";
  text: string;
  timestamp: string;
}

interface ArenaScenario {
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

interface ArenaTypeConfig {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  statsMeta: {
    key: string;
    label: string;
    emoji: string;
    colorClass: string;
    description: string;
  }[];
  initialStats: Record<string, any>;
  tactics: { text: string; label: string }[];
  scenarios: ArenaScenario[];
}

const ARENA_CONFIGS: Record<string, ArenaTypeConfig> = {
  hung_bien: {
    id: "hung_bien",
    name: "Đấu Trường Hùng Biện",
    description: "Tôi luyện kỹ năng diễn thuyết trước công chúng, lập luận đanh thép và thuyết phục đám đông hoài nghi.",
    emoji: "🎤",
    color: "from-amber-500 to-orange-600",
    statsMeta: [
      { key: "approval", label: "Độ Đồng Tình Khán Giả", emoji: "📈", colorClass: "bg-amber-500", description: "Mức độ khán giả ủng hộ quan điểm của bạn" },
      { key: "logic", label: "Điểm Lập Luận (Logic)", emoji: "🧠", colorClass: "bg-indigo-500", description: "Độ chặt chẽ trong hệ thống luận điểm" },
      { key: "rhetoric", label: "Sức Thuyết Phục (Rhetoric)", emoji: "⚡", colorClass: "bg-rose-500", description: "Khả năng truyền cảm hứng và tu từ" }
    ],
    initialStats: { approval: 45, logic: 50, rhetoric: 40, feedback: "Màn hùng biện đang khởi đầu khá thận trọng." },
    tactics: [
      { text: "Lấy số liệu chứng minh & dẫn chứng thực tế: ", label: "📊 Số liệu thực tế" },
      { text: "Sử dụng câu chuyện cá nhân đầy cảm xúc: ", label: "❤️ Câu chuyện cảm xúc" },
      { text: "Bóc trần lỗ hổng logic trong lập luận đối phương: ", label: "🔍 Vạch trần ngụy biện" },
      { text: "Kêu gọi hành động vì lợi ích chung lâu dài: ", label: "🌱 Kêu gọi hành động" }
    ],
    scenarios: [
      {
        id: "green_tax",
        title: "Đề Án Thuế Carbon Khí Hậu",
        description: "Bạn thuyết trình đề xuất áp thuế carbon mới tại buổi họp đại biểu hội đồng thành phố, vấp phải sự phản đối dữ dội từ các doanh nghiệp dầu mỏ lớn.",
        goal: "Đạt trên 65% độ đồng tình từ khán giả để dự luật được thông qua.",
        initialOffer: "Dự luật này vô lý, nó bóp nghẹt các doanh nghiệp địa phương và làm tăng giá nhiên liệu sinh hoạt của người dân nghèo!",
        opponentName: "Mr. Kenneth",
        opponentTitle: "Đại diện Hiệp hội Doanh nghiệp Dầu mỏ",
        opponentBehavior: "Rất giỏi mị dân, đánh vào nỗi lo tài chính ngắn hạn của dân chúng, phản biện hung hăng và sặc mùi thực dụng.",
        opponentEmoji: "💼"
      },
      {
        id: "ai_education",
        title: "Tích Hợp Trợ Lý AI Vào Lớp Học",
        description: "Bạn bảo vệ đề xuất thử nghiệm gia sư AI cá nhân hóa cho học sinh phổ thông trước ban giám hiệu nhà trường có tư duy truyền thống, sợ học sinh lười biếng.",
        goal: "Chứng minh AI hỗ trợ giáo viên chứ không thay thế họ, thuyết phục thí điểm.",
        initialOffer: "AI sẽ phá hủy tư duy tự học của trẻ em, tạo ra một thế hệ gian lận và đánh mất đi tương tác nhân văn tối thiểu của nhà giáo!",
        opponentName: "Thầy Nguyễn Minh",
        opponentTitle: "Hiệu trưởng trường chuyên lâu đời",
        opponentBehavior: "Học thức cao, bảo thủ, coi trọng sự kỷ luật truyền thống, lo ngại sâu sắc về đạo đức công nghệ.",
        opponentEmoji: "👨‍🏫"
      },
      {
        id: "pivot_oratory",
        title: "Tái Cấu Trúc Startup Bán Lẻ Sang Digital",
        description: "Doanh số bán lẻ trực tiếp đang tụt dốc không phanh. Bạn cần thuyết phục các cổ đông lớn đồng ý bơm thêm vốn để chuyển đổi sang mô hình đăng ký dịch vụ số (Subscription model).",
        goal: "Thuyết phục cổ đông đồng ý cấp thêm ngân sách chuyển dịch.",
        initialOffer: "Bỏ đi mảng bán lẻ truyền thống đang là cốt lõi của công ty để chạy theo dịch vụ số mơ hồ là một sự tự sát tài chính vô trách nhiệm!",
        opponentName: "Bà Khánh Chi",
        opponentTitle: "Cổ đông sáng lập & Cố vấn Tài chính",
        opponentBehavior: "Thực dụng, bám sát dòng tiền thực tế, dị ứng với các từ khóa công nghệ hoa mỹ, cực kỳ e ngại rủi ro.",
        opponentEmoji: "👩‍💼"
      }
    ]
  },
  tinh_truong: {
    id: "tinh_truong",
    name: "Đấu Trường Tình Trường",
    description: "Giải quyết các tình huống mâu thuẫn gia đình, bão giông tình cảm, đòi hỏi chỉ số EQ đỉnh cao.",
    emoji: "💖",
    color: "from-rose-500 to-pink-600",
    statsMeta: [
      { key: "harmony", label: "Mức Độ Hòa Hợp", emoji: "🌸", colorClass: "bg-emerald-500", description: "Bầu không khí êm thấm, ít tranh cãi" },
      { key: "connection", label: "Kết Nối Cảm Xúc (EQ)", emoji: "💞", colorClass: "bg-pink-500", description: "Sự thấu hiểu và đồng cảm tâm hồn" },
      { key: "tension", label: "Độ Căng Thẳng (Tension)", emoji: "⚡", colorClass: "bg-amber-500", description: "Sự ức chế dồn nén có thể bùng nổ" }
    ],
    initialStats: { harmony: 40, connection: 45, tension: 50, mood: "Đối phương đang cảm thấy tổn thương và phòng thủ." },
    tactics: [
      { text: "Thừa nhận cảm xúc & nhận lỗi chân thành: ", label: "🙏 Nhận lỗi chân thành" },
      { text: "Nhắc lại một kỷ niệm gắn kết sâu sắc: ", label: "🕯️ Gợi lại kỷ niệm" },
      { text: "Giải thích rõ ràng bối cảnh không có ác ý: ", label: "💬 Giải thích khách quan" },
      { text: "Đưa ra hành động bù đắp thực tế ngay lập tức: ", label: "🎁 Hành động bù đắp" }
    ],
    scenarios: [
      {
        id: "anniversary_forgot",
        title: "Cơn Giận Kỷ Niệm Ngày Cưới",
        description: "Bạn lỡ quên cuộc hẹn tối kỷ niệm 5 năm ngày cưới vì bận xử lý sự cố máy chủ tại văn phòng đến tận đêm muộn. Đối phương đang ngồi đợi một mình và khóc nức nở.",
        goal: "Hạ nhiệt căng thẳng, xoa dịu tổn thương và cứu vãn cuộc hôn nhân.",
        initialOffer: "Điện thoại của anh/em lúc nào cũng là công việc. Em/Anh không cần những lời xin lỗi sáo rỗng nữa, có lẽ chúng ta không còn quan trọng với nhau nữa rồi.",
        opponentName: "Linh Chi",
        opponentTitle: "Người bạn đời nhạy cảm & cô đơn",
        opponentBehavior: "Cảm xúc dâng trào, dễ tổn thương, mong muốn sự hiện diện tinh thần hơn là vật chất bù đắp.",
        opponentEmoji: "💔"
      },
      {
        id: "suburb_vs_downtown",
        title: "Chọn Mua Nhà Ngoại Ô Hay Thuê Phố?",
        description: "Hai bạn chuẩn bị kết hôn. Bạn muốn mua một căn nhà rộng rãi ở ngoại ô để nuôi con lâu dài, nhưng bạn đời của bạn khăng khăng muốn thuê chung cư cao cấp ở trung tâm để tiện đi làm và hưởng tiện ích.",
        goal: "Tìm ra điểm đồng thuận (Win-Win) mà không làm rạn nứt tình cảm đôi bên.",
        initialOffer: "Mua nhà ngoại ô đồng nghĩa với việc mỗi ngày em/anh phải di chuyển 3 tiếng ngoài đường khói bụi! Sống như vậy không phải là sống, đó là tồn tại vật vờ!",
        opponentName: "Hoàng Dương",
        opponentTitle: "Vị hôn phu/hôn thê thực tế",
        opponentBehavior: "Coi trọng chất lượng cuộc sống hàng ngày, ghét đi lại xa xôi, kiên định với lối sống hiện đại đô thị.",
        opponentEmoji: "🏙️"
      },
      {
        id: "protective_parents",
        title: "Buổi Ra Mắt Bố Vợ Tương Lai",
        description: "Lần đầu tiên bạn đến nhà người yêu ăn tối. Người bố là một cựu sĩ quan quân đội nghiêm nghị, không hài lòng về ngành nghề tự do (Freelancer) của bạn và đang chất vấn dồn dập.",
        goal: "Thể hiện bản lĩnh vững vàng, sự chân thành để lấy lòng bố vợ tương lai.",
        initialOffer: "Làm tự do hôm nay có tiền mai thất nghiệp thì làm sao lo nổi cuộc sống ổn định cho con gái tôi? Thanh niên phải có chí hướng rõ ràng, vững chãi!",
        opponentName: "Bác Đăng",
        opponentTitle: "Bố vợ tương lai nghiêm khắc",
        opponentBehavior: "Kỷ luật, truyền thống, yêu con gái hết mực, có xu hướng thử thách tinh thần thép của bạn.",
        opponentEmoji: "👴"
      }
    ]
  },
  tham_tu: {
    id: "tham_tu",
    name: "Đấu Trường Thám Tử",
    description: "Tra khảo nghi phạm lập dị, lật tẩy lời khai mâu thuẫn để phá án thành công.",
    emoji: "🕵️",
    color: "from-slate-700 to-slate-900",
    statsMeta: [
      { key: "defensiveness", label: "Sự Phòng Thủ Nghi Phạm", emoji: "🛡️", colorClass: "bg-red-500", description: "Mức độ nghi phạm che giấu thông tin" },
      { key: "clues", label: "Manh Mối Phát Hiện", emoji: "🔑", colorClass: "bg-yellow-500", description: "Các kẽ hở hoặc chi tiết quan trọng thu thập được" },
      { key: "credibility", label: "Độ Đáng Tin Cậy Lời Khai", emoji: "📋", colorClass: "bg-teal-500", description: "Tính hợp lý khách quan của bằng chứng ngoại phạm" }
    ],
    initialStats: { defensiveness: 75, clues: 0, credibility: 80, suspicion: "Nghi phạm đang rất bình tĩnh và tự tin vào chứng cứ ngoại phạm của mình." },
    tactics: [
      { text: "Bóc trần sự bất nhất giữa mốc thời gian và lời khai trước đó: ", label: "⏳ Bất nhất thời gian" },
      { text: "Đưa ra một vật chứng giả định để thử phản ứng tâm lý: ", label: "🧪 Thử phản ứng tâm lý" },
      { text: "Khéo léo cam kết khoan hồng nếu chịu hợp tác khai báo: ", label: "🤝 Thỏa hiệp khoan hồng" },
      { text: "Đánh úp bằng câu hỏi xoáy trực diện vào động cơ gây án: ", label: "⚡ Hỏi thẳng động cơ" }
    ],
    scenarios: [
      {
        id: "antique_heist",
        title: "Vụ Trộm Đồng Hồ Cổ Triệu Đô",
        description: "Chiếc đồng hồ quý của gia tộc tỷ phú bỗng dưng biến mất khỏi két sắt không có dấu vết cạy phá. Chỉ có Quản gia và Chủ nhà biết mật mã. Bạn đang hỏi cung người quản gia lâu năm.",
        goal: "Tìm ra tung tích chiếc đồng hồ cổ và hạ gục sự chống đối của quản gia.",
        initialOffer: "Thưa thám tử, tôi đã phục vụ gia đình này 25 năm qua với sự trung thành tuyệt đối. Làm sao tôi có thể tự hủy hoại danh dự của mình vì một món đồ cơ chứ? Tối qua tôi chỉ ở trong phòng đọc sách.",
        opponentName: "Quản gia James",
        opponentTitle: "Quản gia hoàng gia điềm tĩnh",
        opponentBehavior: "Lịch thiệp, giữ kẽ, che giấu sự thật tinh vi dưới vỏ bọc trung thành tuyệt đối.",
        opponentEmoji: "👔"
      },
      {
        id: "embezzlement_cfo",
        title: "Vụ Án Sổ Sách Ảo Triệu Đô",
        description: "CFO bị nghi ngờ đã chuyển khoản 20 tỷ VNĐ vào một tài khoản ma ở nước ngoài ngay trước khi hệ thống kiểm toán vào cuộc. Sổ sách của ông ta có nhiều khoản chi mập mờ.",
        goal: "Buộc CFO thừa nhận tài khoản ma và khai ra đồng phạm.",
        initialOffer: "Tất cả các dòng tiền đều được ký duyệt đúng quy trình hoạt động doanh nghiệp. Các người không có quyền chất vấn năng lực nghiệp vụ của một CFO có 15 năm kinh nghiệm!",
        opponentName: "Trần Tiến",
        opponentTitle: "Giám đốc tài chính cao ngạo",
        opponentBehavior: "Kiêu ngạo, am hiểu luật tài chính kẽ hở, sẵn sàng đe dọa ngược thám tử bằng quyền lực pháp lý.",
        opponentEmoji: "🕶️"
      },
      {
        id: "paranoid_scientist",
        title: "Nhân Chứng Lập Dị Đêm Đột Nhập",
        description: "Phòng thí nghiệm sinh học bị đột nhập lấy cắp mẫu thử virus biến đổi gen. Một nữ tiến sĩ lập dị là người duy nhất nhìn thấy kẻ đột nhập từ xa, nhưng cô ấy từ chối hợp tác với cảnh sát vì chứng hoang tưởng.",
        goal: "Xây dựng lòng tin, gạt bỏ sự sợ hãi để cô ấy khai ra đặc điểm nhận dạng thủ phạm.",
        initialOffer: "Cảnh sát các người cũng nằm trong âm mưu đó thôi! Bọn chúng theo dõi tôi qua sóng vô tuyến, tôi sẽ không nói bất cứ điều gì để các người bán đứng tôi đâu!",
        opponentName: "Dr. Angela",
        opponentTitle: "Nhà khoa học hoang tưởng",
        opponentBehavior: "Cực kỳ nghi ngờ, sợ hãi, dễ kích động, tin vào các thuyết âm mưu nhưng nắm giữ chìa khóa phá án quan trọng.",
        opponentEmoji: "🥼"
      }
    ]
  },
  chien_thuat: {
    id: "chien_thuat",
    name: "Đấu Trường Chiến Thuật",
    description: "Quyết sách trong khủng hoảng doanh nghiệp, cân não chiến lược để đạt thắng lợi tối ưu.",
    emoji: "⚔️",
    color: "from-blue-600 to-indigo-750",
    statsMeta: [
      { key: "resource", label: "Tài Nguyên / Binh Lực", emoji: "📦", colorClass: "bg-cyan-500", description: "Nguồn lực tài chính hoặc sinh lực còn lại" },
      { key: "dominance", label: "Thế Chủ Động Chiến Trường", emoji: "👑", colorClass: "bg-indigo-500", description: "Khả năng kiểm soát tình thế trước đối thủ" },
      { key: "risk", label: "Mức Rủi Ro Sụp Đổ", emoji: "⚠️", colorClass: "bg-rose-500", description: "Khả năng thất bại hoàn toàn" }
    ],
    initialStats: { resource: 80, dominance: 35, risk: 40, morale: "Tình hình đang cân bằng, đối phương đang rình rập sơ hở." },
    tactics: [
      { text: "Áp dụng kế hoạch dương đông kích tây / nghi binh chiến lược: ", label: "🎭 Nghi binh chiến lược" },
      { text: "Co cụm phòng thủ sâu, bảo toàn tài nguyên cốt lõi: ", label: "🛡️ Phòng thủ chiều sâu" },
      { text: "Chủ động đề xuất liên minh chia sẻ lợi nhuận ngắn hạn: ", label: "🤝 Liên minh chia sẻ" },
      { text: "Tấn công tổng lực dốc toàn lực vào điểm yếu nhất: ", label: "⚔️ Tấn công tổng lực" }
    ],
    scenarios: [
      {
        id: "pr_recall",
        title: "Khủng Hoảng Sữa Nhiễm Khuẩn",
        description: "Thương hiệu sữa hữu cơ của công ty bạn bị đồn thổi có chứa vi khuẩn gây hại cho trẻ nhỏ. Cổ phiếu bốc hơi 15% trong 2 ngày. Bạn phải quyết định thu hồi toàn bộ (tốn kém khủng khiếp) hay xử lý khủng hoảng khoanh vùng.",
        goal: "Cứu vãn uy tín thương hiệu lâu dài mà không làm công ty phá sản.",
        initialOffer: "Chúng ta nên im lặng, chỉ thu hồi âm thầm các lô bị nghi ngờ và đổ lỗi cho khâu vận chuyển của đại lý phân phối để giảm thiểu thiệt hại tài chính tối đa!",
        opponentName: "Stephen",
        opponentTitle: "Cố vấn PR thực dụng & tàn nhẫn",
        opponentBehavior: "Lạnh lùng, đặt lợi ích tài chính và bảo vệ pháp lý lên hàng đầu, coi thường phản ứng cảm xúc của người tiêu dùng.",
        opponentEmoji: "👔"
      },
      {
        id: "castle_siege",
        title: "Trận Chiến Thủ Thành Tuyệt Vọng",
        description: "Bạn là một tướng quân giữ thành trì biên cương độc đạo. Quân địch đông gấp 3 lần đang vây hãm bên ngoài, cắt đứt nguồn lương thực. Lương thảo trong thành chỉ đủ dùng trong 2 tuần.",
        goal: "Giữ vững thành trì hoặc đàm phán kéo dài thời gian chờ viện binh.",
        initialOffer: "Tướng quân, binh sĩ đang hoang mang tột độ! Đầu hàng là con đường duy nhất để giữ mạng sống cho hàng vạn dân lành trong thành, đầu hàng đi!",
        opponentName: "Phó tướng Trần Huy",
        opponentTitle: "Phó tướng nhụt chí",
        opponentBehavior: "Bi quan, lo sợ cho tính mạng của mình và gia đình, dễ lung lay ý chí chiến đấu.",
        opponentEmoji: "🛡️"
      },
      {
        id: "tech_merger",
        title: "Cuộc Chiến Bản Quyền Với Gã Khổng Lồ",
        description: "Startup công nghệ của bạn vừa đăng ký sáng chế thuật toán AI nén dữ liệu đột phá. Một tập đoàn công nghệ khổng lồ đã copy trắng trợn tính năng này và dọa kiện ngược bạn bằng đội ngũ luật sư hùng hậu.",
        goal: "Đạt thỏa thuận cấp phép bản quyền (Licensing) béo bở hoặc sáp nhập giá trị cao.",
        initialOffer: "Sáng chế của các cậu chỉ là một biến thể nhỏ. Chúng tôi sẵn sàng trả 200.000 USD để mua đứt bản quyền này, nếu không chúng tôi sẽ kéo dài vụ kiện cho đến khi startup của cậu cạn kiệt tài chính!",
        opponentName: "Victor",
        opponentTitle: "CEO Tập đoàn TechGiant",
        opponentBehavior: "Ỷ lớn hiếp bé, mưu mô, dùng sức mạnh tiền bạc để ép giá, nhưng cực kỳ thèm khát công nghệ nén này.",
        opponentEmoji: "🦁"
      }
    ]
  },
  luat_su: {
    id: "luat_su",
    name: "Đấu Trường Luật Sư",
    description: "Bảo chữa cho thân chủ trước tòa án, chất vấn lời khai nhân chứng, đấu trí với công tố viên sắc sảo.",
    emoji: "⚖️",
    color: "from-blue-700 to-indigo-900",
    statsMeta: [
      { key: "juryApproval", label: "Độ Thuyết Phục Bồi Thẩm Đoàn", emoji: "⚖️", colorClass: "bg-blue-600", description: "Sự đồng tình và tin tưởng từ Bồi thẩm đoàn" },
      { key: "evidenceWeight", label: "Trọng Lượng Bằng Chứng", emoji: "📜", colorClass: "bg-teal-500", description: "Độ chặt chẽ và tính pháp lý của chứng cứ" },
      { key: "objectionRisk", label: "Rủi Ro Bị Bác Bỏ (Objection)", emoji: "⚡", colorClass: "bg-amber-500", description: "Khả năng bị đối phương phản bác thành công" }
    ],
    initialStats: { juryApproval: 40, evidenceWeight: 45, objectionRisk: 30, verdict: "Bồi thẩm đoàn đang lắng nghe chăm chú nhưng chưa nghiêng về bên nào." },
    tactics: [
      { text: "Trưng ra bằng chứng ngoại phạm/vật chứng mới tại hiện trường: ", label: "🔍 Chứng cứ mới" },
      { text: "Chỉ ra mâu thuẫn trực diện trong lời khai nhân chứng chống lại thân chủ: ", label: "⚡ Chất vấn mâu thuẫn" },
      { text: "Kêu gọi lòng trắc ẩn và tinh thần thượng tôn pháp luật: ", label: "⚖️ Khơi gợi công lý" },
      { text: "Bác bỏ cáo buộc vô lý từ phía Công tố viên vì thiếu căn cứ: ", label: "🛡️ Bác bỏ cáo buộc" }
    ],
    scenarios: [
      {
        id: "burglary_defense",
        title: "Bảo Chữa Vụ Án Trộm Đêm",
        description: "Thân chủ của bạn bị cáo buộc trộm cắp một bọc trang sức quý từ một biệt thự. Nhân chứng khẳng định đã nhìn thấy bóng dáng anh ta dưới ánh đèn đường lúc 2 giờ sáng.",
        goal: "Thuyết phục bồi thẩm đoàn tin rằng thân chủ bị nhận dạng nhầm do điều kiện thiếu sáng và có bằng chứng ngoại phạm vững chắc.",
        initialOffer: "Thưa Luật sư, nhân chứng của chúng tôi có thị lực hoàn hảo và đã chỉ đích danh thân chủ của ông. Làm sao ông có thể giải thích được việc chiếc áo khoác của anh ta trùng khớp với mô tả của camera an ninh?",
        opponentName: "Công tố viên Hoàng Lâm",
        opponentTitle: "Công tố viên trưởng sắc sảo",
        opponentBehavior: "Lập luận sắc bén, bám sát các chứng cứ kỹ thuật, luôn tìm cách gài bẫy ngôn từ để bạn phạm sai lầm.",
        opponentEmoji: "👨‍⚖️"
      },
      {
        id: "ip_dispute",
        title: "Tranh Chấp Bản Quyền Công Nghệ",
        description: "Một công ty công nghệ lớn cáo buộc startup của thân chủ bạn đánh cắp mã nguồn thuật toán nén ảnh độc quyền. Phía nguyên đơn đòi bồi thường 5 triệu USD.",
        goal: "Chứng minh mã nguồn được viết độc lập bằng phương pháp 'clean room' và bác bỏ cáo buộc sao chép.",
        initialOffer: "Sự tương đồng lên đến 85% trong cấu trúc giải thuật không thể là ngẫu nhiên! Thân chủ của luật sư rõ ràng đã tiếp cận tài liệu mật của chúng tôi khi còn là nhân sự cũ!",
        opponentName: "Luật sư Robert",
        opponentTitle: "Luật sư tập đoàn Nguyên đơn",
        opponentBehavior: "Kiêu ngạo, dùng các thuật ngữ kỹ thuật phức tạp để gây nhiễu, có đội ngũ trợ lý hùng hậu hậu thuẫn.",
        opponentEmoji: "💼"
      }
    ]
  },
  gia_dinh: {
    id: "gia_dinh",
    name: "Đấu Trường Gia Đình",
    description: "Hòa giải các mâu thuẫn muôn thuở giữa các thế hệ, định hướng tương lai con cái hoặc xử lý bất hòa nội bộ ấm êm.",
    emoji: "🏠",
    color: "from-teal-600 to-emerald-700",
    statsMeta: [
      { key: "familyWarmth", label: "Tình Cảm Gia Đình", emoji: "❤️", colorClass: "bg-rose-500", description: "Bầu không khí hòa thuận, sự thấu hiểu tình thân" },
      { key: "generationalGap", label: "Khoảng Cách Thế Hệ", emoji: "🧩", colorClass: "bg-indigo-500", description: "Sự xung đột tư duy, lối sống truyền thống và hiện đại" },
      { key: "filialPiety", label: "Độ Kính Trọng / Trách Nhiệm", emoji: "🙏", colorClass: "bg-emerald-500", description: "Chỉ số hiếu thảo, tôn trọng bổn phận bề trên" }
    ],
    initialStats: { familyWarmth: 45, generationalGap: 60, filialPiety: 50, atmosphere: "Bầu không khí trong nhà đang vô cùng ngột ngạt và căng thẳng." },
    tactics: [
      { text: "Bày tỏ sự thấu hiểu cho nỗi lo lắng và tấm lòng của cha mẹ: ", label: "❤️ Thấu hiểu lòng mẹ cha" },
      { text: "Giải thích nguyện vọng bản thân một cách từ tốn, tôn trọng bề trên: ", label: "👴 Từ tốn giãi bày" },
      { text: "Đề xuất một phương án thỏa hiệp dung hòa lợi ích của cả hai thế hệ: ", label: "🤝 Đề xuất thỏa hiệp" },
      { text: "Nhắc lại công ơn nuôi dưỡng và khẳng định tình cảm gia đình mới là trên hết: ", label: "🍲 Đề cao tình thân" }
    ],
    scenarios: [
      {
        id: "farming_career",
        title: "Bỏ Phố Về Quê Làm Trang Trại",
        description: "Bạn đang làm kỹ sư phần mềm lương cao ở thành phố nhưng quyết định nghỉ việc để về quê trồng nấm organic. Bố mẹ bạn phản đối kịch liệt vì cho rằng đó là sự thụt lùi và nông nổi.",
        goal: "Thuyết phục bố mẹ tin tưởng vào kế hoạch kinh doanh nông nghiệp bền vững của bạn và đồng ý cho mượn mảnh đất trống phía sau nhà.",
        initialOffer: "Nuôi ăn học bao nhiêu năm trời để làm ông này bà nọ ở thủ đô, giờ đòi về cuốc đất nuôi gà! Con định bôi tro trát trấu vào mặt bố mẹ với hàng xóm láng giềng à?",
        opponentName: "Bố Mẹ (Ông Sơn & Bà Mai)",
        opponentTitle: "Phụ huynh truyền thống",
        opponentBehavior: "Giận dữ vì lo lắng cho tương lai con cái, có tư duy trọng danh vọng công việc văn phòng ổn định.",
        opponentEmoji: "👵"
      },
      {
        id: "elderly_care",
        title: "Chia Sẻ Quyền Nuôi Dưỡng Ông Bà",
        description: "Bà nội đã già yếu cần người chăm sóc thường xuyên. Các cô chú trong nhà muốn đưa bà vào viện dưỡng lão tư nhân để chia sẻ chi phí, nhưng bạn muốn tự tay phụng dưỡng bà tại nhà dù cuộc sống bận rộn.",
        goal: "Thuyết phục các thành viên gia đình đồng ý phương án chăm sóc luân phiên hoặc hỗ trợ thuê hộ lý tại nhà để bà được ở gần con cháu.",
        initialOffer: "Ai cũng bận tối mắt tối mũi, để cụ ở nhà một mình nhỡ ngã ra đấy ai biết? Đưa cụ vào viện dưỡng lão có bác sĩ chăm sóc 24/24 mới là văn minh và tốt nhất cho cụ!",
        opponentName: "Bác Cả Hùng",
        opponentTitle: "Trưởng nam thực tế, bận rộn",
        opponentBehavior: "Thực dụng, muốn giải quyết nhanh gọn bằng tiền bạc, e ngại trách nhiệm chăm sóc trực tiếp tốn thời gian.",
        opponentEmoji: "👨"
      }
    ]
  },
  tam_ly: {
    id: "tam_ly",
    name: "Đấu Trường Tâm Lý",
    description: "Thuyết phục khách hàng khủng hoảng, trị liệu vết thương lòng hoặc xoa dịu tâm trí cực kỳ nhạy cảm bằng EQ và sự thấu cảm.",
    emoji: "🧠",
    color: "from-violet-600 to-fuchsia-700",
    statsMeta: [
      { key: "empathyLevel", label: "Độ Thấu Cảm & Đọc Vị", emoji: "🔮", colorClass: "bg-fuchsia-500", description: "Khả năng thấu hiểu và gọi tên chính xác tâm lý đối phương" },
      { key: "defenseBarrier", label: "Hàng Rào Phòng Vệ", emoji: "🛡️", colorClass: "bg-purple-500", description: "Hàng rào phòng ngự bảo vệ cái tôi (Càng thấp càng cởi mở)" },
      { key: "emotionalTrigger", label: "Lay Chuyển Cảm Xúc", emoji: "✨", colorClass: "bg-pink-500", description: "Độ lay động tâm lý, đánh thức động lực thay đổi tích cực" }
    ],
    initialStats: { empathyLevel: 40, defenseBarrier: 70, emotionalTrigger: 30, mentalState: "Đối phương khép kín, tránh né giao tiếp bằng mắt và đề phòng cao độ." },
    tactics: [
      { text: "Xác thực cảm xúc tổn thương và lắng nghe chân thành không phán xét: ", label: "🌸 Đồng cảm vô điều kiện" },
      { text: "Dùng câu hỏi gợi mở phản chiếu cảm xúc để làm sáng tỏ nội tâm: ", label: "💬 Phản chiếu phản tư" },
      { text: "Đánh thức khát vọng sống, ý nghĩa tự thân và ước mơ tốt đẹp: ", label: "🌟 Thổi bùng hy vọng" },
      { text: "Khẳng định sự đồng hành vững chắc, tạo dựng môi trường an toàn cảm xúc: ", label: "🤝 Tạo dựng niềm tin" }
    ],
    scenarios: [
      {
        id: "crisis_intervention",
        title: "Vực Dậy Sau Đổ Vỡ",
        description: "Khách hàng vừa phá sản doanh nghiệp và ly hôn đồng thời. Họ giam mình trong phòng tối biệt lập, từ chối ăn uống và liên tục bày tỏ sự bế tắc, thất vọng tột cùng về cuộc sống.",
        goal: "Mở khóa rào cản phòng vệ tâm lý, giúp họ tìm lại ý nghĩa sự tồn tại và đồng ý ra ngoài tiếp nhận hỗ trợ y tế, xã hội.",
        initialOffer: "Đừng khuyên bảo tôi nữa, các người chẳng thể hiểu nổi cảm giác sụp đổ này đâu. Mọi thứ tôi gầy dựng cả đời đã biến mất, sống tiếp để làm gì nữa?",
        opponentName: "Nam Khánh",
        opponentTitle: "Khách hàng khủng hoảng trầm trọng",
        opponentBehavior: "U uất, nhạy cảm cực hạn, dễ tự ti dằn vặt bản thân, có xu hướng rút lui xã hội mạnh mẽ.",
        opponentEmoji: "🥺"
      },
      {
        id: "imposter_syndrome",
        title: "Trị Liệu Hội Chứng Kẻ Giả Mạo",
        description: "Đồng nghiệp của bạn sắp được bổ nhiệm làm Giám đốc Công nghệ nhưng cô ấy kiên quyết từ chối vì luôn tin mình bất tài, chỉ may mắn, và lo sợ sẽ làm cả công ty thất vọng.",
        goal: "Giúp cô ấy nhìn nhận khách quan các thành quả thực tế, dỡ bỏ hội chứng kẻ giả mạo và dũng cảm đón nhận cơ hội thăng tiến.",
        initialOffer: "Mình thực sự không giỏi đâu! Đợt rồi dự án thành công hoàn toàn là do may mắn và mọi người làm tốt. Nếu mình làm sếp, chắc chắn sẽ sớm muộn bị lộ là kẻ bất tài vô dụng thôi!",
        opponentName: "Phương Anh",
        opponentTitle: "Trưởng nhóm Kỹ thuật xuất sắc",
        opponentBehavior: "Thiếu tự tin nội tại nặng nề, chịu áp lực hoàn hảo hóa, nhạy cảm với sự đánh giá của người khác.",
        opponentEmoji: "👩‍💻"
      }
    ]
  },
  ban_hang: {
    id: "ban_hang",
    name: "Đấu Trường Bán Hàng",
    description: "Chinh phục khách hàng khó tính bậc nhất, đàm phán hợp đồng triệu đô hoặc xử lý phản biện sắc sảo để chốt đơn thành công.",
    emoji: "💰",
    color: "from-amber-600 to-amber-800",
    statsMeta: [
      { key: "trustScore", label: "Niềm Tin Khách Hàng", emoji: "🤝", colorClass: "bg-emerald-500", description: "Độ tin cậy và sự an tâm của khách hàng" },
      { key: "purchaseDesire", label: "Khao Khát Mua Hàng", emoji: "🔥", colorClass: "bg-rose-500", description: "Mức độ sẵn sàng chi tiền sở hữu giải pháp" },
      { key: "objectionHandling", label: "Xử Lý Từ Chối", emoji: "🧠", colorClass: "bg-blue-500", description: "Khả năng hóa giải các rào cản và e ngại" }
    ],
    initialStats: { trustScore: 40, purchaseDesire: 35, objectionHandling: 30, decisionState: "Khách hàng đang lưỡng lự, cho rằng giá quá cao và chưa thấy sự khác biệt." },
    tactics: [
      { text: "Đồng cảm sâu sắc và chỉ ra giải pháp giải quyết triệt để nỗi đau: ", label: "🌸 Đồng cảm thấu hiểu" },
      { text: "Trưng ra số liệu tiết kiệm chi phí và tăng trưởng doanh thu vượt trội: ", label: "📊 Chứng minh hiệu quả (ROI)" },
      { text: "Đưa ra chính sách bảo hành vàng, dùng thử miễn phí hoặc cam kết hoàn tiền: ", label: "🛡️ Rủi ro bằng 0" },
      { text: "Kích hoạt ưu đãi giới hạn cực hời chỉ áp dụng trong hôm nay: ", label: "⚡ Tạo khan hiếm" }
    ],
    scenarios: [
      {
        id: "b2b_erp_sales",
        title: "Chốt Deal ERP Triệu Đô",
        description: "Bạn đang chào bán hệ thống quản trị doanh nghiệp tổng thể (ERP) cho một tập đoàn dệt may truyền thống đồ sộ. Vị CEO thế hệ trước tin vào sổ sách thủ công hơn là AI hay công nghệ đám mây.",
        goal: "Thuyết phục vị CEO tin tưởng giải pháp giúp tối ưu hóa chi phí vận hành 25% và đồng ý ký hợp đồng dùng thử giai đoạn 1.",
        initialOffer: "Vận hành bằng Excel và sổ sách hơn 20 năm nay chúng tôi vẫn lãi nghìn tỷ. Đầu tư hệ thống ERP của các anh vừa đắt đỏ, vừa phức tạp, công nhân làm sao biết dùng? Nhỡ sập hệ thống thì mất hết dữ liệu à?",
        opponentName: "Chủ tịch Trần Thế",
        opponentTitle: "Nhà sáng lập thế hệ trước, vô cùng thực tế",
        opponentBehavior: "Cực kỳ tiết kiệm chi phí, ghét lý thuyết công nghệ bóng bẩy, coi trọng kết quả tài chính thực tiễn ngay lập tức.",
        opponentEmoji: "👴"
      },
      {
        id: "premium_villa_sales",
        title: "Chốt Biệt Thự Biển Triệu Đô",
        description: "Một vị khách hàng siêu giàu đang tìm kiếm một căn biệt thự nghỉ dưỡng ven biển Đà Nẵng để khẳng định đẳng cấp và đầu tư dài hạn. Tuy nhiên, họ rất am hiểu thị trường bất động sản và đang so sánh gắt gao với các dự án đối thủ.",
        goal: "Khơi gợi khao khát sở hữu tính độc bản và cam kết dòng tiền sinh lời bền vững để chốt đặt cọc 10% ngay trong cuộc nói chuyện.",
        initialOffer: "Dự án bên kia vị trí cũng tương tự nhưng giá rẻ hơn tận 15%, pháp lý lại có vẻ nhanh hơn. Dự án của em thiết kế thì đẹp đấy, nhưng giá đắt quá và tính thanh khoản có thực sự tốt không?",
        opponentName: "Phu nhân Khánh Chi",
        opponentTitle: "Nhà đầu tư bất động sản sành sỏi",
        opponentBehavior: "Tinh tế, sành điệu, hay ép giá, luôn đòi hỏi các dịch vụ độc quyền và thông tin chi tiết về dòng tiền.",
        opponentEmoji: "💅"
      }
    ]
  }
};

export const ArenasPanel: React.FC = () => {
  const [selectedArenaKey, setSelectedArenaKey] = useState<string>("hung_bien");
  
  // Custom scenario states loaded from localStorage
  const [customScenarios, setCustomScenarios] = useState<Record<string, ArenaScenario[]>>(() => {
    try {
      const saved = localStorage.getItem("arena_custom_scenarios");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");
  const [activeScenario, setActiveScenario] = useState<ArenaScenario | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [stats, setStats] = useState<Record<string, any>>({});
  const [turnCount, setTurnCount] = useState(0);
  const [maxTurns, setMaxTurns] = useState<number>(8);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  // States for custom scenario form
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [customOpponentName, setCustomOpponentName] = useState("");
  const [customOpponentTitle, setCustomOpponentTitle] = useState("");
  const [customOpponentBehavior, setCustomOpponentBehavior] = useState("");
  const [customOpponentEmoji, setCustomOpponentEmoji] = useState("👤");
  const [customInitialOffer, setCustomInitialOffer] = useState("");

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentArenaConfig = ARENA_CONFIGS[selectedArenaKey];

  // Combined list of standard and custom scenarios
  const allScenarios = [
    ...currentArenaConfig.scenarios,
    ...(customScenarios[selectedArenaKey] || [])
  ];

  // Persist custom scenarios to localStorage
  useEffect(() => {
    localStorage.setItem("arena_custom_scenarios", JSON.stringify(customScenarios));
  }, [customScenarios]);

  useEffect(() => {
    // Select first scenario by default when arena type changes
    const config = ARENA_CONFIGS[selectedArenaKey];
    const custom = customScenarios[selectedArenaKey] || [];
    const combined = [...config.scenarios, ...custom];
    if (combined.length > 0) {
      setSelectedScenarioId(combined[0].id);
    }
    // Close scenario creation panel when changing types
    setIsCreatingCustom(false);
    setAiPrompt("");
    resetCustomForm();
  }, [selectedArenaKey]);

  const resetCustomForm = () => {
    setCustomTitle("");
    setCustomDescription("");
    setCustomGoal("");
    setCustomOpponentName("");
    setCustomOpponentTitle("");
    setCustomOpponentBehavior("");
    setCustomOpponentEmoji("👤");
    setCustomInitialOffer("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleStartGame = () => {
    const sc = allScenarios.find(s => s.id === selectedScenarioId);
    if (!sc) return;

    setActiveScenario(sc);
    setStats({ ...currentArenaConfig.initialStats });
    setTurnCount(0);
    setEvaluation(null);
    setLastEvent(null);
    setErrorMsg(null);
    
    setMessages([
      {
        id: "init",
        role: "opponent",
        text: `[Trận Đấu Bắt Đầu] Xin chào, tôi là ${sc.opponentName} (${sc.opponentTitle}). Liên quan đến "${sc.title}", quan điểm khởi đầu của tôi là: "${sc.initialOffer}". Hãy đưa ra phản hồi đầu tiên của bạn!`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setGameStarted(true);
  };

  const handleGenerateCustomScenario = async () => {
    if (!aiPrompt.trim()) {
      setErrorMsg("Vui lòng nhập ý tưởng kịch bản để AI thiết kế.");
      return;
    }
    setIsGeneratingScenario(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/arena-generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arenaType: selectedArenaKey,
          topicPrompt: aiPrompt
        })
      });
      if (!res.ok) {
        throw new Error("Không thể kết nối máy chủ để tạo kịch bản.");
      }
      const data = await res.json();
      setCustomTitle(data.title || "");
      setCustomDescription(data.description || "");
      setCustomGoal(data.goal || "");
      setCustomOpponentName(data.opponentName || "");
      setCustomOpponentTitle(data.opponentTitle || "");
      setCustomOpponentBehavior(data.opponentBehavior || "");
      setCustomOpponentEmoji(data.opponentEmoji || "👤");
      setCustomInitialOffer(data.initialOffer || "");
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tạo kịch bản tự động.");
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const handleSaveCustomScenario = () => {
    if (!customTitle.trim() || !customGoal.trim() || !customOpponentName.trim() || !customInitialOffer.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ các thông tin kịch bản bắt buộc (Tiêu đề, mục tiêu, tên đối thủ, phát ngôn khởi đầu).");
      return;
    }

    const newSc: ArenaScenario = {
      id: "custom_" + Date.now(),
      title: customTitle,
      description: customDescription || "Kịch bản tùy chỉnh do người dùng tạo.",
      goal: customGoal,
      initialOffer: customInitialOffer,
      opponentName: customOpponentName,
      opponentTitle: customOpponentTitle || "Đối thủ tự do",
      opponentBehavior: customOpponentBehavior || "Bình thường, sẵn sàng đối thoại",
      opponentEmoji: customOpponentEmoji || "👤"
    };

    setCustomScenarios(prev => {
      const currentList = prev[selectedArenaKey] || [];
      return {
        ...prev,
        [selectedArenaKey]: [...currentList, newSc]
      };
    });

    setSelectedScenarioId(newSc.id);
    setIsCreatingCustom(false);
    resetCustomForm();
    setAiPrompt("");
  };

  const handleDeleteCustomScenario = (scenarioId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chọn kịch bản khi click nút xóa
    if (window.confirm("Bạn có chắc muốn xóa kịch bản tùy chỉnh này?")) {
      setCustomScenarios(prev => {
        const currentList = prev[selectedArenaKey] || [];
        return {
          ...prev,
          [selectedArenaKey]: currentList.filter(s => s.id !== scenarioId)
        };
      });
      // Reset về kịch bản mặc định đầu tiên nếu đang chọn chính kịch bản bị xóa
      const defaultScenarios = currentArenaConfig.scenarios;
      if (selectedScenarioId === scenarioId && defaultScenarios.length > 0) {
        setSelectedScenarioId(defaultScenarios[0].id);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !activeScenario) return;

    const userMsg: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    setErrorMsg(null);

    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);

    try {
      const res = await fetch("/api/arena-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arenaType: selectedArenaKey,
          history: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
          lastMessage: userMsg.text,
          stats: stats,
          scenario: activeScenario
        })
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối máy chủ đấu trường.");
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
      if (data.event) {
        setLastEvent(data.event);
      }

      if (nextTurn >= maxTurns) {
        // Auto trigger final report
        triggerEvaluation([...messages, userMsg, {
          id: "temp",
          role: "opponent",
          text: data.reply,
          timestamp: ""
        }], data.stats);
      }

    } catch (err: any) {
      setErrorMsg(err.message || "Gặp sự cố kết nối AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEvaluation = async (historyList: Message[], finalStats = stats) => {
    if (!activeScenario) return;
    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/arena-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arenaType: currentArenaConfig.name,
          history: historyList.map(m => ({ role: m.role, text: m.text })),
          stats: finalStats,
          scenario: activeScenario
        })
      });

      if (!res.ok) {
        throw new Error("Không thể phân tích kết quả đấu trường.");
      }

      const evalData = await res.json();
      setEvaluation(evalData);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleForfeit = () => {
    if (window.confirm("Bạn có chắc chắn muốn đầu hàng/rút lui giữa chừng? Kết quả sẽ được chấm điểm dựa trên diễn biến hiện tại.")) {
      triggerEvaluation(messages);
    }
  };

  const handleReset = () => {
    setGameStarted(false);
    setActiveScenario(null);
    setMessages([]);
    setEvaluation(null);
    setTurnCount(0);
    setLastEvent(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-2 animate-fade-in" id="universal-arenas">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-rose-950 rounded-2xl p-6 text-white mb-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/25">
              <Flame className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display">Tổ Hợp Đấu Trường Trí Tuệ (Intellect Arenas Hub)</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Nơi thử thách và mài giũa tư duy dưới các áp lực thực chiến: Hùng biện, Tình trường, Thám tử & Chiến thuật.
              </p>
            </div>
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

      {!gameStarted ? (
        /* SETUP MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Arena Type Selector (Left) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              1. Chọn Loại Đấu Trường
            </h3>
            {Object.values(ARENA_CONFIGS).map((arena) => (
              <button
                key={arena.id}
                onClick={() => {
                  setSelectedArenaKey(arena.id);
                  setEvaluation(null);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 cursor-pointer ${
                  selectedArenaKey === arena.id
                    ? "bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-100"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-5/40"
                }`}
              >
                <span className="text-3xl p-2 bg-slate-50 border border-slate-150 rounded-xl flex-shrink-0">
                  {arena.emoji}
                </span>
                <div className="font-sans flex-1 min-w-0">
                  <h4 className={`text-xs font-bold leading-tight ${selectedArenaKey === arena.id ? "text-indigo-700" : "text-slate-800"}`}>
                    {arena.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate mt-1 leading-normal">{arena.description}</p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedArenaKey === arena.id ? "text-indigo-600 translate-x-1" : "text-slate-400"}`} />
              </button>
            ))}
          </div>

          {/* Scenario Picker (Middle) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">
                2. Chọn Kịch Bản Thách Thức
              </h3>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {allScenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenarioId(sc.id);
                      setIsCreatingCustom(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                      selectedScenarioId === sc.id
                        ? "bg-indigo-50/50 border-indigo-500 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-350"
                    }`}
                  >
                    <span className="text-2xl p-2 bg-slate-50 border border-slate-200 rounded-lg flex-shrink-0">
                      {sc.opponentEmoji || "👤"}
                    </span>
                    <div className="font-sans flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-bold truncate ${selectedScenarioId === sc.id ? "text-indigo-700" : "text-slate-800"}`}>
                          {sc.title}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {sc.id.startsWith("custom_") && (
                            <button
                              onClick={(e) => handleDeleteCustomScenario(sc.id, e)}
                              className="p-1 hover:bg-rose-100 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Xóa kịch bản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {selectedScenarioId === sc.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {sc.description}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between text-[9px] font-mono font-bold text-slate-400 uppercase">
                        <span>Đối thủ: {sc.opponentName}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setIsCreatingCustom(true);
                setSelectedScenarioId("");
                resetCustomForm();
              }}
              className="w-full mt-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-dashed border-indigo-300 text-indigo-700 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4" /> TỰ TẠO KỊCH BẢN MỚI
            </button>
          </div>

          {/* Preview, Launch or Custom Creator (Right) */}
          {isCreatingCustom ? (
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between max-h-[600px] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Tự Thiết Kế Kịch Bản
                  </h3>
                  <button 
                    onClick={() => {
                      setIsCreatingCustom(false);
                      if (allScenarios.length > 0) setSelectedScenarioId(allScenarios[0].id);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    HỦY
                  </button>
                </div>

                {/* AI Generator Panel */}
                <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1.5 font-sans">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase flex items-center gap-1">
                    🤖 Tạo Nhanh Bằng AI
                  </span>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    Nhập ý tưởng ngắn, AI sẽ tự động soạn thảo đầy đủ các trường thông tin đối đầu cực kỳ lôi cuốn.
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Đòi tăng lương 20%, Chia tay người yêu..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-indigo-500 font-sans"
                      disabled={isGeneratingScenario}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && aiPrompt.trim()) {
                          handleGenerateCustomScenario();
                        }
                      }}
                    />
                    <button
                      onClick={handleGenerateCustomScenario}
                      disabled={isGeneratingScenario || !aiPrompt.trim()}
                      className="px-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer transition-all"
                    >
                      {isGeneratingScenario ? "Đang viết..." : "Tạo"}
                    </button>
                  </div>
                </div>

                {/* Manual form fields */}
                <div className="space-y-3 text-xs font-sans">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Tiêu Đề Kịch Bản *</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Đòi sếp tăng lương"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Mục Tiêu Tranh Đấu *</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Thuyết phục sếp duyệt tăng 15% lương"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">Tên Đối Thủ *</label>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: Trưởng phòng Huy"
                        value={customOpponentName}
                        onChange={(e) => setCustomOpponentName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">Chức vụ/Vai trò</label>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: Sếp quản lý trực tiếp"
                        value={customOpponentTitle}
                        onChange={(e) => setCustomOpponentTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">Tính Cách/Thái Độ</label>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: Khó tính, tính toán chi ly"
                        value={customOpponentBehavior}
                        onChange={(e) => setCustomOpponentBehavior(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">Emoji</label>
                      <input 
                        type="text" 
                        maxLength={2}
                        placeholder="👤"
                        value={customOpponentEmoji}
                        onChange={(e) => setCustomOpponentEmoji(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs text-center outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Bối Cảnh Trận Chiến</label>
                    <textarea 
                      placeholder="Mô tả hoàn cảnh xung đột chi tiết để AI nhập vai..."
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-all resize-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Lời Đối Thủ Mở Màn *</label>
                    <textarea 
                      placeholder="Lượt đối thoại/mặc cả đầu tiên của đối thủ khi bắt đầu đấu trường..."
                      value={customInitialOffer}
                      onChange={(e) => setCustomInitialOffer(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-all resize-none font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => {
                    setIsCreatingCustom(false);
                    if (allScenarios.length > 0) setSelectedScenarioId(allScenarios[0].id);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer font-sans"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSaveCustomScenario}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer font-sans"
                >
                  Lưu kịch bản
                </button>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  3. Chi Tiết Thử Thách
                </h3>
                {(() => {
                  const sc = allScenarios.find(s => s.id === selectedScenarioId);
                  if (!sc) return <p className="text-xs text-slate-400 font-sans">Vui lòng chọn một kịch bản hoặc bấm nút tự tạo.</p>;
                  return (
                    <div className="space-y-4 font-sans animate-fade-in">
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-600 space-y-1">
                        <span className="font-bold text-slate-800">🎯 Mục tiêu:</span>
                        <p>{sc.goal}</p>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <span className="font-bold text-slate-800 block">👤 Thông tin đối thủ:</span>
                        <p className="font-semibold text-indigo-600 text-[11px]">
                          {sc.opponentName} ({sc.opponentTitle})
                        </p>
                        <p className="text-[11px] text-slate-500 leading-relaxed italic mt-1">
                          "{sc.opponentBehavior}"
                        </p>
                      </div>

                      {/* Cấu hình số lượt đối thoại */}
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100/80 rounded-xl text-xs text-slate-700 space-y-2">
                        <span className="font-bold text-slate-800 block text-[11px]">⚙️ Độ dài cuộc đối đầu:</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[5, 8, 12, 15].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setMaxTurns(num)}
                              className={`py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                                maxTurns === num
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-350"
                              }`}
                            >
                              {num} lượt
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-500 leading-normal">
                          ⚠️ {maxTurns === 5 ? "Màn đấu nhanh, đòi hỏi thuyết phục trực diện." : maxTurns === 8 ? "Màn đấu tiêu chuẩn, đủ thời gian dẫn dắt lập luận." : maxTurns === 12 ? "Đấu trí chuyên sâu, cần chiến thuật đa chiều." : "Trận chiến trường kỳ kịch tính, kiểm tra sức dẻo dai."}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <button
                onClick={handleStartGame}
                disabled={!selectedScenarioId}
                className="w-full mt-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2 font-mono"
              >
                VÀO ĐẤU TRƯỜNG <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : evaluation ? (
        /* EVALUATION REPORT REPORT */
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg animate-fade-in font-sans">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white text-center border-b border-indigo-800">
            <div className="inline-flex p-3 bg-white/10 rounded-full mb-3 border border-white/20">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold font-display">BẢN ĐÁNH GIÁ KẾT QUẢ ĐẤU TRƯỜNG</h2>
            <p className="text-xs text-slate-300 mt-1 uppercase tracking-wider font-mono">
              Phân tích chuyên môn bởi Ban Trọng Tài Tri Thức AI
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider">
                  Lời Phán Quyết
                </span>
                <span className="text-xs font-bold mt-2 px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-150 rounded-full">
                  {evaluation.verdict}
                </span>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider">
                  Điểm Số Tư Duy
                </span>
                <div className="relative flex items-center justify-center mt-1">
                  <span className="text-3xl font-extrabold text-indigo-600 font-display">
                    {evaluation.score}
                  </span>
                  <span className="text-xs font-bold text-indigo-400 self-end mb-1 ml-0.5">/100</span>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-inner col-span-1">
                <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider">
                  Trận Đấu Đã Thử Thách
                </span>
                <h4 className="text-xs font-bold text-slate-800 mt-2 truncate max-w-full">
                  {activeScenario.title}
                </h4>
              </div>
            </div>

            {/* Narrative Conclusion */}
            <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-950 font-mono uppercase tracking-wider">
                📜 Kết Cục Câu Chuyện
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{evaluation.finalSummary}"
              </p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <span className="p-1 bg-emerald-100 rounded-lg text-emerald-600">✓</span> Điểm Sáng Tranh Đấu
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
                  <span className="p-1 bg-rose-100 rounded-lg text-rose-600">✗</span> Lỗi Tư Duy & Sơ Hở
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
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Bản Đồ Phân Tích Chiến Thuật Đã Dùng
              </h4>
              <div className="space-y-2.5">
                {evaluation.tacticsAnalyzed.map((tac: any, i: number) => (
                  <div key={i} className="bg-white border border-slate-150 rounded-xl p-3.5 flex flex-col md:flex-row gap-2 md:items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 min-w-[200px] flex items-center gap-1.5">
                      ⚔️ {tac.tactic}
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed flex-1 md:pl-4 md:border-l border-slate-200">
                      {tac.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Strategic Advice */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-2">
              <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Chỉ Dẫn Khắc Phục Lỗi Tư Duy
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line italic">
                "{evaluation.improvementAdvice}"
              </p>
            </div>

            {/* Play Again */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Quay Lại Bảng Kịch Bản
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE ARENA BATTLEPLAY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Scenarios and Gauge parameters */}
          <div className="lg:col-span-4 space-y-4 font-sans">
            {/* Scenario objectives */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold border-b border-slate-100 pb-2 block">
                Nhiệm Vụ Chiến Trường
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{activeScenario.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  {activeScenario.description}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-800 leading-relaxed">
                🎯 <span className="font-bold">Mục tiêu:</span> {activeScenario.goal}
              </div>
            </div>

            {/* Indicators */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold border-b border-slate-100 pb-2 flex justify-between">
                <span>Trạng Thái Cân Não</span>
                <span className="font-bold">Lượt {turnCount}/{maxTurns}</span>
              </div>

              {/* Dynamic stats render based on active Arena Type */}
              {currentArenaConfig.statsMeta.map((meta) => {
                const currentVal = stats[meta.key] || 0;
                return (
                  <div key={meta.key} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-600 flex items-center gap-1">
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="font-bold text-indigo-700">{currentVal}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${meta.colorClass}`}
                        style={{ width: `${currentVal}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 leading-tight">{meta.description}</p>
                  </div>
                );
              })}

              {/* Sub-status box */}
              {selectedArenaKey === "hung_bien" && stats.feedback && (
                <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-xl text-[10px] text-slate-600">
                  <span className="font-bold block mb-0.5">💬 Trạng thái khán phòng:</span>
                  <p className="italic">"{stats.feedback}"</p>
                </div>
              )}
              {selectedArenaKey === "tinh_truong" && stats.mood && (
                <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-xl text-[10px] text-slate-600">
                  <span className="font-bold block mb-0.5">💭 Tâm lý đối phương:</span>
                  <p className="italic">"{stats.mood}"</p>
                </div>
              )}
              {selectedArenaKey === "tham_tu" && stats.suspicion && (
                <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-xl text-[10px] text-slate-600">
                  <span className="font-bold block mb-0.5">👁️ Phản ứng cơ thể nghi phạm:</span>
                  <p className="italic">"{stats.suspicion}"</p>
                </div>
              )}
              {selectedArenaKey === "chien_thuat" && stats.morale && (
                <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-xl text-[10px] text-slate-600">
                  <span className="font-bold block mb-0.5">🚩 Tình thế quân binh:</span>
                  <p className="italic">"{stats.morale}"</p>
                </div>
              )}

              {lastEvent && (
                <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-[10px] text-rose-800 animate-pulse">
                  🔔 <span className="font-bold">Biến cố:</span> {lastEvent}
                </div>
              )}
            </div>

            {/* Walk away */}
            <button
              onClick={handleForfeit}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-350 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center font-mono"
            >
              🏁 Đầu Hàng / Kết Thúc Sớm
            </button>
          </div>

          {/* Chat Panel (Right) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center px-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Đối Kháng Trực Tiếp
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeScenario.opponentEmoji}</span>
                <span className="text-[10px] font-bold text-slate-700 font-mono bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-md">
                  {activeScenario.opponentName}
                </span>
              </div>
            </div>

            {/* Chat message flow */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs font-sans leading-relaxed shadow-xs flex flex-col ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white font-medium rounded-tr-none"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none pr-6"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span
                      className={`text-[9px] font-mono self-end mt-2 opacity-75 ${
                        msg.role === "user" ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {msg.role === "user" ? "BẠN" : activeScenario.opponentName.toUpperCase()} • {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-none p-4 max-w-[85%] flex items-center gap-2 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-bounce delay-300" />
                    <span className="text-xs font-mono text-slate-500 ml-1.5">Đối thủ đang suy tính phản ngôn...</span>
                  </div>
                </div>
              )}

              {isEvaluating && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <span className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                  <p className="text-xs text-indigo-800 font-bold">Ban Hội Đồng Trọng Tài Đang Thực Hiện Chấm Điểm Thuyết Phục...</p>
                  <p className="text-[10px] text-slate-500">Hệ thống phân tích từng lời thoại để lập bản đồ tư duy của bạn.</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input and strategies */}
            {!evaluation && !isEvaluating && (
              <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
                {/* Tactics templates */}
                <div className="flex gap-2 overflow-x-auto pb-1 select-none custom-scrollbar">
                  {currentArenaConfig.tactics.map((tac, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInputText((prev) => tac.text + prev)}
                      className="flex-shrink-0 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-[10px] text-slate-700 font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                    >
                      {tac.label}
                    </button>
                  ))}
                </div>

                {/* Main Input form */}
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
                    placeholder={`Nhập lý lẽ thương nghị... (Còn lại ${maxTurns - turnCount} lượt)`}
                    className="flex-1 bg-white border border-slate-200 focus:border-slate-800 text-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-slate-800 transition-all font-sans"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="p-3 bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all cursor-pointer flex-shrink-0 flex items-center justify-center font-semibold shadow-md active:scale-95"
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
