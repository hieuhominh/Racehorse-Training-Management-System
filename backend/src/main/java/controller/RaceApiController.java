package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import model.User;
import util.SecurityUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Servlet API Giải đua & Quyết toán tài chính 2 Mô hình song song:
 * - Mô hình A: Giải đấu bên ngoài (External) - Owner tự đăng ký, hoa hồng 0%
 * - Mô hình B: Giải đấu nội bộ (Internal) - Admin tổ chức, hoa hồng 5% - 8%
 *
 * Endpoints:
 * - GET    /api/races, /api/races/nominations, /api/races/audit-logs, /api/finance/settlements
 * - POST   /api/races (Tạo giải mới - Admin)
 * - POST   /api/races/nominations (Đăng ký giải đấu - Owner)
 * - POST   /api/races/nominations/{id}/approve (Phê duyệt đơn - Admin)
 * - POST   /api/races/nominations/{id}/reject (Từ chối đơn - Admin)
 * - POST   /api/races/nominations/{id}/settle (Quyết toán giải thưởng - Admin/Owner)
 * - PUT    /api/races/{id} (Cập nhật trạng thái giải - Admin)
 */
@WebServlet(name = "RaceApiController", urlPatterns = {
    "/api/races",
    "/api/races/*",
    "/api/finance/settlements",
    "/api/finance/settlements/*"
})
public class RaceApiController extends HttpServlet {

    private final Gson gson = new Gson();

    // In-memory data stores for high-performance concurrent access
    private static final List<Map<String, Object>> memoryTournaments = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryNominations = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryAuditLogs = Collections.synchronizedList(new ArrayList<>());

    static {
        // 1. SEED DỮ LIỆU GIẢI ĐẤU (CẢ 2 MÔ HÌNH A VÀ B)
        Map<String, Object> t1 = new HashMap<>();
        t1.put("id", "TOURN-2026-01");
        t1.put("name", "Giải Vô Địch Cúp Derby Mùa Thu 2026 (Group 1)");
        t1.put("tournamentType", "INTERNAL"); // MÔ HÌNH B
        t1.put("organizerName", "Ban Quản Trị Mã Trường Phú Thọ");
        t1.put("track", "Trường đua Quốc tế Phú Thọ");
        t1.put("surface", "Sân cỏ Tự nhiên (Turf)");
        t1.put("distance", "2.400m");
        t1.put("date", "15/11/2026");
        t1.put("regOpenDate", "01/10/2026");
        t1.put("regCloseDate", "08/11/2026");
        t1.put("totalPurse", 1500000000L);
        t1.put("entryFee", 10000000L);
        t1.put("commissionRate", 0.05); // HOA HỒNG 5%
        t1.put("rulesAndTerms", "Giải đấu nội bộ quy mô toàn quốc. Nền tảng áp dụng trích 5% hoa hồng trên tổng tiền thưởng thực tế của Chủ ngựa.");
        t1.put("isActiveOnPlatform", true);
        t1.put("status", "OPEN");
        memoryTournaments.add(t1);

        Map<String, Object> t2 = new HashMap<>();
        t2.put("id", "TOURN-2026-02");
        t2.put("name", "Cúp Nước Rút Tốc Độ Sprint Cup 2026 (Group 2)");
        t2.put("tournamentType", "INTERNAL"); // MÔ HÌNH B
        t2.put("organizerName", "Ban Quản Trị Mã Trường Phú Thọ");
        t2.put("track", "Trường đua Cát Thể Thao Đại Nam");
        t2.put("surface", "Sân cát Nén (Dirt)");
        t2.put("distance", "1.200m");
        t2.put("date", "28/11/2026");
        t2.put("regOpenDate", "05/10/2026");
        t2.put("regCloseDate", "20/11/2026");
        t2.put("totalPurse", 800000000L);
        t2.put("entryFee", 5000000L);
        t2.put("commissionRate", 0.08); // HOA HỒNG 8%
        t2.put("rulesAndTerms", "Giải đấu cự ly ngắn bứt phá. Nền tảng áp dụng trích 8% hoa hồng trên tổng tiền thưởng giải đấu.");
        t2.put("isActiveOnPlatform", true);
        t2.put("status", "OPEN");
        memoryTournaments.add(t2);

        Map<String, Object> t3 = new HashMap<>();
        t3.put("id", "TOURN-2026-EXT-01");
        t3.put("name", "Giải Đua Ngựa Truyền Thống Bắc Hà 2026");
        t3.put("tournamentType", "EXTERNAL"); // MÔ HÌNH A
        t3.put("organizerName", "Sở Văn Hóa Thể Thao & Du Lịch Lào Cai");
        t3.put("track", "Sân Vận Động Huyện Bắc Hà, Lào Cai");
        t3.put("surface", "Sân cát tự nhiên (Sand)");
        t3.put("distance", "1.600m");
        t3.put("date", "10/12/2026");
        t3.put("regOpenDate", "15/10/2026");
        t3.put("regCloseDate", "25/11/2026");
        t3.put("totalPurse", 300000000L);
        t3.put("entryFee", 2000000L);
        t3.put("commissionRate", 0.00); // HOA HỒNG 0%
        t3.put("rulesAndTerms", "Giải đấu bên ngoài độc lập. Chủ ngựa tự đăng ký và nộp lệ phí trực tiếp cho BTC Bắc Hà. Nền tảng không thu hoa hồng (0%).");
        t3.put("isActiveOnPlatform", true);
        t3.put("status", "OPEN");
        memoryTournaments.add(t3);

        Map<String, Object> t4 = new HashMap<>();
        t4.put("id", "TOURN-2026-EXT-02");
        t4.put("name", "Cúp Quốc Tế Bangkok Turf Club Open 2026");
        t4.put("tournamentType", "EXTERNAL"); // MÔ HÌNH A
        t4.put("organizerName", "Royal Bangkok Sports Club (Thái Lan)");
        t4.put("track", "Trường đua Bangkok RBSC, Thái Lan");
        t4.put("surface", "Sân cỏ Quốc tế (Turf)");
        t4.put("distance", "2.000m");
        t4.put("date", "20/12/2026");
        t4.put("regOpenDate", "20/10/2026");
        t4.put("regCloseDate", "30/11/2026");
        t4.put("totalPurse", 1200000000L);
        t4.put("entryFee", 15000000L);
        t4.put("commissionRate", 0.00); // HOA HỒNG 0%
        t4.put("rulesAndTerms", "Giải đấu quốc tế ngoài. Chủ ngựa tự túc thủ tục và nộp trực tiếp cho BTC Thái Lan. Hoa hồng nền tảng: 0%.");
        t4.put("isActiveOnPlatform", true);
        t4.put("status", "OPEN");
        memoryTournaments.add(t4);

        // 2. SEED ĐƠN ĐĂNG KÝ & QUYẾT TOÁN MẪU THEO ĐÚNG VÍ DỤ NGHIỆP VỤ
        // Đơn 1: Mô hình B hoa hồng 5% -> Gross 500M, Hoa hồng 25M, Thực nhận 475M
        Map<String, Object> e1 = new HashMap<>();
        e1.put("id", "REG-TOURN-01");
        e1.put("raceId", "TOURN-2026-01");
        e1.put("raceName", "Giải Vô Địch Cúp Derby Mùa Thu 2026 (Group 1)");
        e1.put("tournamentType", "INTERNAL");
        e1.put("horseName", "Xích Thố");
        e1.put("ownerName", "Phạm Tiến Thành");
        e1.put("ownerKey", "owner_thanh");
        e1.put("jockey", "Nguyễn Văn Hùng");
        e1.put("status", "CONFIRMED");
        e1.put("paymentStatus", "PAID");
        e1.put("ownerAgreedTerms", true);
        e1.put("finalRank", 1);
        e1.put("grossPrize", 500000000L);
        e1.put("commissionRate", 0.05);
        e1.put("commissionAmount", 25000000L);
        e1.put("netPayout", 475000000L);
        e1.put("settledAt", "10/11/2026 14:00:00");
        memoryNominations.add(e1);

        // Đơn 2: Mô hình B hoa hồng 8% -> Gross 500M, Hoa hồng 40M, Thực nhận 460M
        Map<String, Object> e2 = new HashMap<>();
        e2.put("id", "REG-TOURN-02");
        e2.put("raceId", "TOURN-2026-02");
        e2.put("raceName", "Cúp Nước Rút Tốc Độ Sprint Cup 2026 (Group 2)");
        e2.put("tournamentType", "INTERNAL");
        e2.put("horseName", "Hắc Phong");
        e2.put("ownerName", "Phạm Tiến Thành");
        e2.put("ownerKey", "owner_thanh");
        e2.put("jockey", "Trần Quốc Bảo");
        e2.put("status", "CONFIRMED");
        e2.put("paymentStatus", "PAID");
        e2.put("ownerAgreedTerms", true);
        e2.put("finalRank", 2);
        e2.put("grossPrize", 500000000L);
        e2.put("commissionRate", 0.08);
        e2.put("commissionAmount", 40000000L);
        e2.put("netPayout", 460000000L);
        e2.put("settledAt", "09/11/2026 16:30:00");
        memoryNominations.add(e2);

        // Đơn 3: Mô hình A giải ngoài -> Gross 150M, Hoa hồng 0%, Thực nhận 150M
        Map<String, Object> e3 = new HashMap<>();
        e3.put("id", "REG-TOURN-03");
        e3.put("raceId", "TOURN-2026-EXT-01");
        e3.put("raceName", "Giải Đua Ngựa Truyền Thống Bắc Hà 2026");
        e3.put("tournamentType", "EXTERNAL");
        e3.put("horseName", "Xích Thố");
        e3.put("ownerName", "Phạm Tiến Thành");
        e3.put("ownerKey", "owner_thanh");
        e3.put("jockey", "Vàng A Lử");
        e3.put("status", "CONFIRMED");
        e3.put("paymentStatus", "EXEMPT");
        e3.put("ownerAgreedTerms", true);
        e3.put("finalRank", 1);
        e3.put("grossPrize", 150000000L);
        e3.put("commissionRate", 0.00);
        e3.put("commissionAmount", 0L);
        e3.put("netPayout", 150000000L);
        e3.put("settledAt", "05/11/2026 11:20:00");
        memoryNominations.add(e3);

        // 3. SEED AUDIT LOG KHỞI TẠO
        addAuditLog("SYSTEM", "INITIALIZE_PARALLEL_TOURNAMENTS", "RACES", "ALL",
            "Khởi tạo thành công 2 mô hình giải đấu: Mô hình A (External, 0% hoa hồng) & Mô hình B (Internal, 5%-8% hoa hồng).");
    }

    private static synchronized void addAuditLog(String user, String action, String entityType, String entityId, String details) {
        Map<String, Object> log = new HashMap<>();
        log.put("id", "AUDIT-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
        log.put("user", user != null ? user : "system");
        log.put("action", action);
        log.put("entityType", entityType);
        log.put("entityId", entityId);
        log.put("details", details);
        log.put("timestamp", new SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new Date()));
        memoryAuditLogs.add(0, log);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();
        String pathInfo = request.getPathInfo();

        try (PrintWriter out = response.getWriter()) {
            // 1. LẤY NHẬT KÝ KIỂM TOÁN (AUDIT LOGS)
            if ("/nominations".equals(pathInfo)) {
                String ownerKey = request.getParameter("ownerKey");
                String status = request.getParameter("status");
                String type = request.getParameter("type");

                List<Map<String, Object>> result = new ArrayList<>();
                synchronized (memoryNominations) {
                    for (Map<String, Object> nom : memoryNominations) {
                        if (ownerKey != null && !ownerKey.trim().isEmpty() && !"ALL".equalsIgnoreCase(ownerKey)) {
                            if (!ownerKey.equalsIgnoreCase(String.valueOf(nom.get("ownerKey")))) continue;
                        }
                        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                            if (!status.equalsIgnoreCase(String.valueOf(nom.get("status")))) continue;
                        }
                        if (type != null && !type.trim().isEmpty() && !"ALL".equalsIgnoreCase(type)) {
                            if (!type.equalsIgnoreCase(String.valueOf(nom.get("tournamentType")))) continue;
                        }
                        result.add(nom);
                    }
                }
                out.print(gson.toJson(result));
                out.flush();
                return;
            }

            if ("/audit-logs".equals(pathInfo)) {
                out.print(gson.toJson(memoryAuditLogs));
                out.flush();
                return;
            }

            // 2. LẤY BÁO CÁO ĐỐI SOÁT TÀI CHÍNH
            if ("/api/finance/settlements".equals(path)) {
                List<Map<String, Object>> settlements = new ArrayList<>();
                synchronized (memoryNominations) {
                    for (Map<String, Object> nom : memoryNominations) {
                        if (nom.containsKey("netPayout") && nom.get("netPayout") != null && ((Number)nom.get("netPayout")).longValue() > 0) {
                            settlements.add(nom);
                        }
                    }
                }
                out.print(gson.toJson(settlements));
                out.flush();
                return;
            }

            // 3. DANH SÁCH GIẢI ĐẤU (HỖ TRỢ LỌC THEO MÔ HÌNH: INTERNAL / EXTERNAL / ALL)
            String typeFilter = request.getParameter("type"); // 'INTERNAL', 'EXTERNAL', 'ALL'
            List<Map<String, Object>> filtered = new ArrayList<>();
            synchronized (memoryTournaments) {
                for (Map<String, Object> t : memoryTournaments) {
                    if (typeFilter != null && !typeFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(typeFilter)) {
                        String tType = String.valueOf(t.get("tournamentType"));
                        if (!typeFilter.equalsIgnoreCase(tType)) {
                            continue;
                        }
                    }
                    filtered.add(t);
                }
            }

            out.print(gson.toJson(filtered));
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải danh sách giải đua hoặc đối soát.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        User authUser = SecurityUtil.getAuthenticatedUser(request);
        String username = authUser != null ? authUser.getUsername() : "admin";

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                body = new JsonObject();
            }

            // A. PHÊ DUYỆT ĐƠN ĐĂNG KÝ (ADMIN APPROVE)
            if (pathInfo != null && pathInfo.endsWith("/approve")) {
                String entryId = pathInfo.replace("/nominations/", "").replace("/approve", "").replace("/", "");
                Map<String, Object> target = null;
                synchronized (memoryNominations) {
                    for (Map<String, Object> nom : memoryNominations) {
                        if (entryId.equalsIgnoreCase(String.valueOf(nom.get("id")))) {
                            nom.put("status", "APPROVED");
                            nom.put("approvedBy", username);
                            target = nom;
                            break;
                        }
                    }
                }
                if (target != null) {
                    addAuditLog(username, "APPROVE_NOMINATION", "RACE_ENTRIES", entryId,
                        "Admin đã phê duyệt đơn đăng ký của chiến mã " + target.get("horseName") + " cho giải " + target.get("raceName"));
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(target));
                    }
                    return;
                } else {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy hồ sơ đăng ký.");
                    return;
                }
            }

            // B. TỪ CHỐI ĐƠN ĐĂNG KÝ (ADMIN REJECT)
            if (pathInfo != null && pathInfo.endsWith("/reject")) {
                String entryId = pathInfo.replace("/nominations/", "").replace("/reject", "").replace("/", "");
                String reason = SecurityUtil.getString(body, "reason", "Không đủ điều kiện tiêu chuẩn giải.");
                Map<String, Object> target = null;
                synchronized (memoryNominations) {
                    for (Map<String, Object> nom : memoryNominations) {
                        if (entryId.equalsIgnoreCase(String.valueOf(nom.get("id")))) {
                            nom.put("status", "REJECTED");
                            nom.put("rejectionReason", reason);
                            nom.put("rejectedBy", username);
                            target = nom;
                            break;
                        }
                    }
                }
                if (target != null) {
                    addAuditLog(username, "REJECT_NOMINATION", "RACE_ENTRIES", entryId,
                        "Admin từ chối đơn đăng ký giải " + target.get("raceName") + " vì: " + reason);
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(target));
                    }
                    return;
                } else {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy hồ sơ đăng ký.");
                    return;
                }
            }

            // C. QUYẾT TOÁN KẾT QUẢ & TIỀN THƯỞNG (ADMIN / OWNER SETTLE PRIZE)
            if (pathInfo != null && pathInfo.endsWith("/settle")) {
                String entryId = pathInfo.replace("/nominations/", "").replace("/settle", "").replace("/", "");
                int finalRank = SecurityUtil.getInt(body, "finalRank", 1);
                long grossPrize = (long) SecurityUtil.getDouble(body, "grossPrize", 0);

                Map<String, Object> target = null;
                synchronized (memoryNominations) {
                    for (Map<String, Object> nom : memoryNominations) {
                        if (entryId.equalsIgnoreCase(String.valueOf(nom.get("id")))) {
                            target = nom;
                            break;
                        }
                    }
                }

                if (target == null) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy hồ sơ thi đấu để quyết toán.");
                    return;
                }

                String tournType = String.valueOf(target.get("tournamentType"));
                double commRate = 0.00;

                // TÍNH HOA HỒNG CHUẨN XÁC THEO MÔ HÌNH NGHIỆP VỤ:
                if ("INTERNAL".equalsIgnoreCase(tournType)) {
                    Object r = target.get("commissionRate");
                    if (r instanceof Number) {
                        commRate = ((Number) r).doubleValue();
                    } else {
                        commRate = 0.05; // Mặc định 5% nếu không có
                    }
                } else {
                    // MÔ HÌNH A: Giải ngoài độc lập -> Hoa hồng 0%
                    commRate = 0.00;
                }

                long commissionAmount = Math.round(grossPrize * commRate);
                long netPayout = grossPrize - commissionAmount;

                target.put("finalRank", finalRank);
                target.put("grossPrize", grossPrize);
                target.put("commissionRate", commRate);
                target.put("commissionAmount", commissionAmount);
                target.put("netPayout", netPayout);
                target.put("status", "CONFIRMED");
                target.put("settledAt", new SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new Date()));

                addAuditLog(username, "SETTLE_PRIZE", "RACE_ENTRIES", entryId,
                    String.format("Quyết toán giải %s: Hạng %d, Tổng thưởng %d đ, Hoa hồng (%.1f%%) = %d đ, Thực nhận = %d đ.",
                        target.get("raceName"), finalRank, grossPrize, commRate * 100, commissionAmount, netPayout));

                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(target));
                }
                return;
            }

            // D. ĐĂNG KÝ THAM GIA GIẢI ĐẤU MỚI (OWNER REGISTRATION HOẶC KHAI BÁO GIẢI NGOÀI)
            if ("/nominations".equals(pathInfo)) {
                String raceId = SecurityUtil.getString(body, "raceId", "");
                String raceName = SecurityUtil.getString(body, "raceName", "Giải Đua Ngựa");
                String horseName = SecurityUtil.getString(body, "horseName", "Chiến mã");
                String ownerName = SecurityUtil.getString(body, "ownerName", authUser != null ? authUser.getFullName() : "Chủ ngựa");
                String ownerKey = SecurityUtil.getString(body, "ownerKey", authUser != null ? authUser.getUsername() : "owner");
                String tournamentType = SecurityUtil.getString(body, "tournamentType", "INTERNAL");
                double commissionRate = SecurityUtil.getDouble(body, "commissionRate", "INTERNAL".equalsIgnoreCase(tournamentType) ? 0.05 : 0.00);
                boolean ownerAgreedTerms = SecurityUtil.getBoolean(body, "ownerAgreedTerms", false);
                long entryFee = (long) SecurityUtil.getDouble(body, "entryFee", 0);

                // Kiểm tra điều khoản hoa hồng đối với giải nội bộ
                if ("INTERNAL".equalsIgnoreCase(tournamentType) && !ownerAgreedTerms) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Bạn cần xác nhận đồng ý với thể lệ và mức hoa hồng nền tảng trước khi nộp đơn.");
                    return;
                }

                Map<String, Object> newNom = new HashMap<>();
                newNom.put("id", "REG-" + System.currentTimeMillis() % 1000000);
                newNom.put("raceId", raceId);
                newNom.put("raceName", raceName);
                newNom.put("tournamentType", tournamentType);
                newNom.put("horseName", horseName);
                newNom.put("ownerName", ownerName);
                newNom.put("ownerKey", ownerKey);
                newNom.put("jockey", SecurityUtil.getString(body, "jockey", "HLV chỉ định"));
                newNom.put("entryFee", entryFee);
                newNom.put("commissionRate", commissionRate);
                newNom.put("ownerAgreedTerms", ownerAgreedTerms);
                newNom.put("status", "EXTERNAL".equalsIgnoreCase(tournamentType) ? "CONFIRMED" : "PENDING");
                newNom.put("paymentStatus", "EXTERNAL".equalsIgnoreCase(tournamentType) ? "EXEMPT" : "UNPAID");
                newNom.put("registeredAt", new SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new Date()));

                // Nếu là giải ngoài và có kết quả nhập trước
                if (body.has("grossPrize") && body.get("grossPrize").getAsLong() > 0) {
                    long gross = body.get("grossPrize").getAsLong();
                    int rank = SecurityUtil.getInt(body, "finalRank", 1);
                    newNom.put("finalRank", rank);
                    newNom.put("grossPrize", gross);
                    newNom.put("commissionAmount", 0L);
                    newNom.put("netPayout", gross);
                    newNom.put("settledAt", new SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new Date()));
                }

                memoryNominations.add(0, newNom);

                addAuditLog(username, "CREATE_NOMINATION", "RACE_ENTRIES", String.valueOf(newNom.get("id")),
                    "Chủ sở hữu " + ownerName + " nộp đơn giải " + raceName + " (" + tournamentType + ")");

                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(newNom));
                }
                return;
            }

            // E. ADMIN TẠO GIẢI ĐẤU MỚI (CREATE NEW TOURNAMENT - MÔ HÌNH B HOẶC A)
            String name = SecurityUtil.getString(body, "name", "").trim();
            if (name.isEmpty()) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Tên giải đấu không được để trống.");
                return;
            }

            String tournamentType = SecurityUtil.getString(body, "tournamentType", "INTERNAL");
            double commissionRate = SecurityUtil.getDouble(body, "commissionRate", "INTERNAL".equalsIgnoreCase(tournamentType) ? 0.05 : 0.00);

            Map<String, Object> newTourn = new HashMap<>();
            newTourn.put("id", "TOURN-" + System.currentTimeMillis() % 1000000);
            newTourn.put("name", name);
            newTourn.put("tournamentType", tournamentType);
            newTourn.put("organizerName", SecurityUtil.getString(body, "organizerName", "Ban Quản Trị Mã Trường"));
            newTourn.put("track", SecurityUtil.getString(body, "track", "Trường đua Quốc tế"));
            newTourn.put("surface", SecurityUtil.getString(body, "surface", "Sân cỏ Tự nhiên (Turf)"));
            newTourn.put("distance", SecurityUtil.getString(body, "distance", "1.600m"));
            newTourn.put("date", SecurityUtil.getString(body, "date", "15/12/2026"));
            newTourn.put("regOpenDate", SecurityUtil.getString(body, "regOpenDate", "01/11/2026"));
            newTourn.put("regCloseDate", SecurityUtil.getString(body, "regCloseDate", "01/12/2026"));
            newTourn.put("totalPurse", (long) SecurityUtil.getDouble(body, "totalPurse", 500000000L));
            newTourn.put("entryFee", (long) SecurityUtil.getDouble(body, "entryFee", 5000000L));
            newTourn.put("commissionRate", commissionRate);
            newTourn.put("rulesAndTerms", SecurityUtil.getString(body, "rulesAndTerms", "Thể lệ giải đấu chính thức."));
            newTourn.put("isActiveOnPlatform", true);
            newTourn.put("status", "OPEN");

            memoryTournaments.add(0, newTourn);

            addAuditLog(username, "CREATE_TOURNAMENT", "RACES", String.valueOf(newTourn.get("id")),
                String.format("Tạo mới giải đấu '%s' (%s) với tỷ lệ hoa hồng %.1f%%.", name, tournamentType, commissionRate * 100));

            response.setStatus(HttpServletResponse.SC_CREATED);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(newTourn));
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi xử lý nghiệp vụ giải đua: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        User authUser = SecurityUtil.getAuthenticatedUser(request);
        String username = authUser != null ? authUser.getUsername() : "admin";

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (pathInfo != null && pathInfo.length() > 1) {
                String tournId = pathInfo.replace("/", "");
                Map<String, Object> found = null;
                synchronized (memoryTournaments) {
                    for (Map<String, Object> t : memoryTournaments) {
                        if (tournId.equalsIgnoreCase(String.valueOf(t.get("id")))) {
                            if (body.has("name")) t.put("name", SecurityUtil.getString(body, "name", String.valueOf(t.get("name"))).trim());
                            if (body.has("organizerName")) t.put("organizerName", SecurityUtil.getString(body, "organizerName", String.valueOf(t.get("organizerName"))));
                            if (body.has("track")) t.put("track", SecurityUtil.getString(body, "track", String.valueOf(t.get("track"))));
                            if (body.has("surface")) t.put("surface", SecurityUtil.getString(body, "surface", String.valueOf(t.get("surface"))));
                            if (body.has("distance")) t.put("distance", SecurityUtil.getString(body, "distance", String.valueOf(t.get("distance"))));
                            if (body.has("date")) t.put("date", SecurityUtil.getString(body, "date", String.valueOf(t.get("date"))));
                            if (body.has("regCloseDate")) t.put("regCloseDate", SecurityUtil.getString(body, "regCloseDate", String.valueOf(t.get("regCloseDate"))));
                            if (body.has("entryDeadline")) t.put("entryDeadline", SecurityUtil.getString(body, "entryDeadline", String.valueOf(t.get("entryDeadline"))));
                            if (body.has("totalPurse")) t.put("totalPurse", (long) SecurityUtil.getDouble(body, "totalPurse", ((Number) t.getOrDefault("totalPurse", 0L)).doubleValue()));
                            if (body.has("entryFee")) t.put("entryFee", (long) SecurityUtil.getDouble(body, "entryFee", ((Number) t.getOrDefault("entryFee", 0L)).doubleValue()));
                            if (body.has("commissionRate")) t.put("commissionRate", SecurityUtil.getDouble(body, "commissionRate", ((Number) t.getOrDefault("commissionRate", 0.05)).doubleValue()));
                            if (body.has("rulesAndTerms")) t.put("rulesAndTerms", SecurityUtil.getString(body, "rulesAndTerms", String.valueOf(t.get("rulesAndTerms"))));
                            if (body.has("description")) t.put("description", SecurityUtil.getString(body, "description", String.valueOf(t.get("description"))));
                            if (body.has("status")) t.put("status", body.get("status").getAsString());
                            if (body.has("isActiveOnPlatform")) t.put("isActiveOnPlatform", body.get("isActiveOnPlatform").getAsBoolean());
                            found = t;
                            break;
                        }
                    }
                }

                if (found != null) {
                    addAuditLog(username, "UPDATE_TOURNAMENT", "RACES", tournId,
                        "Cập nhật trạng thái giải đấu " + found.get("name"));
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(found));
                    }
                    return;
                }
            }
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy giải đấu cần cập nhật.");
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Lỗi cập nhật giải đấu.");
        }
    }
}
