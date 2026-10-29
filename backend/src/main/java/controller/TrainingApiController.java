package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.HorseDAO;
import model.Horse;
import model.User;
import util.SecurityUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servlet API Giáo án huấn luyện, Chỉ số viễn trắc & Quản lý Đề cử Giải đua (Trainer Portal API)
 * Endpoints:
 * - GET, POST /api/training/programs
 * - GET, POST /api/training/telemetry
 * - GET /api/trainer/horses
 * - GET /api/trainer/nominations
 * - POST /api/trainer/nominations/review
 * - PUT /api/trainer/feedback/*
 */
@WebServlet(name = "TrainingApiController", urlPatterns = {
    "/api/training/programs",
    "/api/training/programs/*",
    "/api/training/telemetry",
    "/api/trainer/horses",
    "/api/trainer/nominations",
    "/api/trainer/nominations/review",
    "/api/trainer/feedback",
    "/api/trainer/feedback/*"
})
public class TrainingApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryPrograms = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryTelemetry = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryNominations = Collections.synchronizedList(new ArrayList<>());
    private static final Map<String, Map<String, Object>> memoryFeedback = new ConcurrentHashMap<>();

    static {
        Map<String, Object> p1 = new HashMap<>();
        p1.put("id", "PROG-01");
        p1.put("title", "Giáo án Tăng Tốc & Nước Rút 800m");
        p1.put("horse", "Xích Thố");
        p1.put("horseChip", "982-000-348-192-001");
        p1.put("phase", "Giai đoạn Siết Cân & Nước Rút");
        p1.put("surface", "Sân Cát (Sand)");
        p1.put("targetDistance", 800);
        p1.put("status", "ACTIVE");
        memoryPrograms.add(p1);

        Map<String, Object> p2 = new HashMap<>();
        p2.put("id", "PROG-02");
        p2.put("title", "Giáo án Thể Lực & Sức Bền 2.400m");
        p2.put("horse", "Bạch Long");
        p2.put("horseChip", "982-000-348-192-002");
        p2.put("phase", "Xây Dựng Sức Bền Nền Tảng");
        p2.put("surface", "Sân Cỏ (Turf)");
        p2.put("targetDistance", 2400);
        p2.put("status", "ACTIVE");
        memoryPrograms.add(p2);

        Map<String, Object> t1 = new HashMap<>();
        t1.put("id", 1);
        t1.put("sessionTime", "06:15 - Hôm nay");
        t1.put("horse", "Hắc Phong");
        t1.put("heartRate", 188);
        t1.put("speed", 58.4);
        t1.put("distance", 1200);
        t1.put("alert", true);
        t1.put("status", "Chạy nước rút");
        memoryTelemetry.add(t1);

        Map<String, Object> n1 = new HashMap<>();
        n1.put("id", "RN-2026-01");
        n1.put("raceName", "Giải Vô Địch Cúp Derby Mùa Thu 2026");
        n1.put("track", "Trường đua Quốc tế Phú Thọ");
        n1.put("horseName", "Bạch Long");
        n1.put("ownerName", "Lê Minh Tuấn (VIP)");
        n1.put("ownerKey", "owner_tuan");
        n1.put("distance", "2.400m (Sân cỏ)");
        n1.put("date", "15/11/2026");
        n1.put("estimatedPurse", 800000000L);
        n1.put("nominationStatus", "APPROVED");
        n1.put("status", "APPROVED");
        n1.put("jockey", "Kỵ mã Nguyễn Văn Tài");
        n1.put("trainerFeedback", "Đạt chuẩn thể lực cự ly 2.400m, nhịp tim ổn định 38 bpm.");
        n1.put("reviewedBy", "HLV Trưởng Trần Văn Hùng");
        n1.put("reviewedAt", "21/10/2026 09:30");
        memoryNominations.add(n1);

        Map<String, Object> n2 = new HashMap<>();
        n2.put("id", "RN-2026-02");
        n2.put("raceName", "Cúp Nước Rút Tốc Độ Sprint Cup 1.200m");
        n2.put("track", "Trường đua Cát Thể Thao");
        n2.put("horseName", "Lôi Chấn");
        n2.put("ownerName", "Hoàng Long Vũ");
        n2.put("ownerKey", "owner_vu");
        n2.put("distance", "1.200m (Sân cát)");
        n2.put("date", "28/11/2026");
        n2.put("estimatedPurse", 450000000L);
        n2.put("nominationStatus", "PENDING_TRAINER");
        n2.put("status", "PENDING");
        n2.put("jockey", "Kỵ mã Trần Quốc Bảo");
        n2.put("trainerFeedback", "");
        n2.put("reviewedBy", null);
        n2.put("reviewedAt", null);
        memoryNominations.add(n2);
    }

    private final HorseDAO horseDAO = new HorseDAO();
    private final Gson gson = new Gson();

    public static List<Map<String, Object>> getSharedNominations() {
        return memoryNominations;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/trainer/horses".equals(path)) {
                List<Horse> horses = horseDAO.getAllHorses();
                out.print(gson.toJson(horses));
                out.flush();
                return;
            }

            if ("/api/training/programs".equals(path)) {
                synchronized (memoryPrograms) {
                    out.print(gson.toJson(memoryPrograms));
                }
                out.flush();
                return;
            }

            if ("/api/training/telemetry".equals(path)) {
                synchronized (memoryTelemetry) {
                    out.print(gson.toJson(memoryTelemetry));
                }
                out.flush();
                return;
            }

            if ("/api/trainer/nominations".equals(path)) {
                synchronized (memoryNominations) {
                    out.print(gson.toJson(memoryNominations));
                }
                out.flush();
                return;
            }

            out.print("[]");
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải dữ liệu huấn luyện.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "TRAINER", "MANAGER");
        if (authUser == null) {
            return;
        }

        String path = request.getServletPath();

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu yêu cầu không hợp lệ.");
                return;
            }

            // 1. POST /api/training/programs: Tạo giáo án huấn luyện mới
            if ("/api/training/programs".equals(path)) {
                String title = SecurityUtil.getString(body, "title", "").trim();
                String horse = SecurityUtil.getString(body, "horse",
                    SecurityUtil.getString(body, "horseName", "")).trim();

                if (title.isEmpty() || horse.isEmpty()) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Vui lòng nhập tiêu đề giáo án và tên chiến mã.");
                    return;
                }

                if (SecurityUtil.containsMaliciousPayload(title) || SecurityUtil.containsMaliciousPayload(horse)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Dữ liệu giáo án chứa ký tự không hợp lệ.");
                    return;
                }

                Map<String, Object> newProg = new HashMap<>();
                newProg.put("id", SecurityUtil.getString(body, "id", "PROG-" + System.currentTimeMillis()));
                newProg.put("title", SecurityUtil.sanitize(title));
                newProg.put("horse", SecurityUtil.sanitize(horse));
                newProg.put("horseChip", SecurityUtil.sanitize(SecurityUtil.getString(body, "horseChip", "")));
                newProg.put("phase", SecurityUtil.sanitize(SecurityUtil.getString(body, "phase", "Giai đoạn Huấn luyện")));
                newProg.put("surface", SecurityUtil.sanitize(SecurityUtil.getString(body, "surface", "Sân Cát (Sand)")));
                newProg.put("targetDistance", SecurityUtil.getInt(body, "targetDistance", 1200));
                newProg.put("status", SecurityUtil.getString(body, "status", "ACTIVE"));

                memoryPrograms.add(0, newProg);
                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(newProg));
                    out.flush();
                }
                return;
            }

            // 2. POST /api/training/telemetry: Ghi nhận chỉ số viễn trắc
            if ("/api/training/telemetry".equals(path)) {
                String horse = SecurityUtil.getString(body, "horse",
                    SecurityUtil.getString(body, "horseName", "")).trim();
                if (horse.isEmpty() || SecurityUtil.containsMaliciousPayload(horse)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Tên chiến mã trong phiên viễn trắc không hợp lệ.");
                    return;
                }

                int heartRate = SecurityUtil.getInt(body, "heartRate", 180);
                double speed = SecurityUtil.getDouble(body, "speed", 55.0);
                int distance = SecurityUtil.getInt(body, "distance", 1200);

                if (heartRate <= 0 || heartRate > 300 || speed < 0 || distance < 0) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Chỉ số sinh hiệu / tốc độ không hợp lệ.");
                    return;
                }

                Map<String, Object> newTel = new HashMap<>();
                newTel.put("id", System.currentTimeMillis());
                newTel.put("sessionTime", SecurityUtil.getString(body, "sessionTime", "Hôm nay"));
                newTel.put("horse", SecurityUtil.sanitize(horse));
                newTel.put("heartRate", heartRate);
                newTel.put("speed", speed);
                newTel.put("distance", distance);
                newTel.put("alert", heartRate >= 210);
                newTel.put("status", SecurityUtil.sanitize(SecurityUtil.getString(body, "status", "Hoàn thành")));

                memoryTelemetry.add(0, newTel);
                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(newTel));
                    out.flush();
                }
                return;
            }

            // 3. POST /api/trainer/nominations/review: HLV trưởng phê duyệt / từ chối đề cử giải đua
            if ("/api/trainer/nominations/review".equals(path)) {
                String nominationId = SecurityUtil.getString(body, "nominationId",
                    SecurityUtil.getString(body, "id", "")).trim();
                String status = SecurityUtil.getString(body, "status", "APPROVED").trim().toUpperCase();
                String feedback = SecurityUtil.getString(body, "feedback", "").trim();
                String trainerName = SecurityUtil.getString(body, "trainerName", authUser.getFullName()).trim();

                if (nominationId.isEmpty()) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Thiếu mã đề cử giải đua (nominationId).");
                    return;
                }

                if (SecurityUtil.containsMaliciousPayload(feedback)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Nội dung nhận xét chứa ký tự không hợp lệ.");
                    return;
                }

                Map<String, Object> updatedItem = null;
                synchronized (memoryNominations) {
                    for (Map<String, Object> item : memoryNominations) {
                        if (nominationId.equals(String.valueOf(item.get("id")))) {
                            item.put("nominationStatus", status);
                            item.put("status", status);
                            item.put("trainerFeedback", SecurityUtil.sanitize(feedback));
                            item.put("reviewedBy", SecurityUtil.sanitize(trainerName));
                            item.put("reviewedAt", "Hôm nay");
                            updatedItem = item;
                            break;
                        }
                    }
                }

                if (updatedItem == null) {
                    updatedItem = new HashMap<>();
                    updatedItem.put("id", nominationId);
                    updatedItem.put("nominationStatus", status);
                    updatedItem.put("status", status);
                    updatedItem.put("trainerFeedback", SecurityUtil.sanitize(feedback));
                    updatedItem.put("reviewedBy", SecurityUtil.sanitize(trainerName));
                }

                response.setStatus(HttpServletResponse.SC_OK);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(updatedItem));
                    out.flush();
                }
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi xử lý dữ liệu huấn luyện.");
        }
    }

    /**
     * PUT /api/trainer/feedback/{id}: Cập nhật đánh giá chuyên môn của HLV cho chiến mã
     */
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "TRAINER", "MANAGER");
        if (authUser == null) {
            return;
        }

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu yêu cầu không hợp lệ.");
                return;
            }

            String horseId = "";
            String pathInfo = request.getPathInfo();
            if (pathInfo != null && pathInfo.length() > 1) {
                horseId = pathInfo.substring(1).trim();
            } else {
                horseId = SecurityUtil.getString(body, "horseId", SecurityUtil.getString(body, "id", "")).trim();
            }

            if (horseId.isEmpty() || SecurityUtil.containsMaliciousPayload(horseId)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Mã chiến mã không hợp lệ.");
                return;
            }

            String feedback = SecurityUtil.getString(body, "feedback", "").trim();
            if (feedback.isEmpty() || SecurityUtil.containsMaliciousPayload(feedback)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Nội dung nhận xét không hợp lệ.");
                return;
            }

            Map<String, Object> record = new HashMap<>();
            record.put("horseId", horseId);
            record.put("feedback", SecurityUtil.sanitize(feedback));
            record.put("updatedBy", authUser.getFullName());
            record.put("updatedAt", System.currentTimeMillis());
            memoryFeedback.put(horseId, record);

            response.setStatus(HttpServletResponse.SC_OK);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(record));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi cập nhật nhận xét huấn luyện.");
        }
    }
}
