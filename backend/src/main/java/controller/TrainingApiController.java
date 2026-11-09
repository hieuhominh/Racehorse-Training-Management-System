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
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
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
    "/api/training/telemetry/*",
    "/api/training/sessions",
    "/api/training/sessions/*",
    "/api/training/joint-sessions",
    "/api/training/joint-sessions/*",
    "/api/trainer/horses",
    "/api/trainer/nominations",
    "/api/trainer/nominations/review",
    "/api/trainer/feedback",
    "/api/trainer/feedback/*"
})
public class TrainingApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryPrograms = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryTelemetry = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryJointSessions = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryNominations = Collections.synchronizedList(new ArrayList<>());
    private static final Map<String, Map<String, Object>> memoryFeedback = new ConcurrentHashMap<>();

    static {
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

            if ("/api/training/telemetry".equals(path) || "/api/training/sessions".equals(path)) {
                synchronized (memoryTelemetry) {
                    out.print(gson.toJson(memoryTelemetry));
                }
                out.flush();
                return;
            }

            if ("/api/training/joint-sessions".equals(path) || (path != null && path.startsWith("/api/training/joint-sessions"))) {
                String trainerUser = request.getParameter("trainerUsername");
                String date = request.getParameter("sessionDate");
                List<Map<String, Object>> result = new ArrayList<>();
                synchronized (memoryJointSessions) {
                    for (Map<String, Object> s : memoryJointSessions) {
                        if (trainerUser != null && !trainerUser.trim().isEmpty() && !"ALL".equalsIgnoreCase(trainerUser)) {
                            if (!trainerUser.equalsIgnoreCase(String.valueOf(s.get("trainerUsername")))) continue;
                        }
                        if (date != null && !date.trim().isEmpty()) {
                            if (!date.equals(String.valueOf(s.get("sessionDate")))) continue;
                        }
                        result.add(s);
                    }
                }
                out.print(gson.toJson(result));
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

        String path = request.getServletPath();
        User authUser;
        if (path != null && path.startsWith("/api/training/joint-sessions")) {
            authUser = SecurityUtil.requireRole(request, response, "OWNER", "TRAINER", "MANAGER", "ADMIN");
        } else {
            authUser = SecurityUtil.requireRole(request, response, "TRAINER", "MANAGER");
        }
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

            // 2. POST /api/training/telemetry hoặc /api/training/sessions: Ghi nhận chỉ số viễn trắc & đánh giá buổi tập
            if ("/api/training/telemetry".equals(path) || "/api/training/sessions".equals(path)) {
                String horse = SecurityUtil.getString(body, "horse",
                    SecurityUtil.getString(body, "horseName", "")).trim();
                if (horse.isEmpty() || SecurityUtil.containsMaliciousPayload(horse)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Tên chiến mã trong phiên viễn trắc không hợp lệ.");
                    return;
                }

                int heartRate = SecurityUtil.getInt(body, "maxHeartRate",
                    SecurityUtil.getInt(body, "heartRate", 180));
                double speed = SecurityUtil.getDouble(body, "avgSpeed",
                    SecurityUtil.getDouble(body, "speed", 55.0));
                int distance = SecurityUtil.getInt(body, "distanceRun",
                    SecurityUtil.getInt(body, "distance", 1200));

                if (heartRate <= 0 || heartRate > 300 || speed < 0 || distance < 0) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Chỉ số sinh hiệu / tốc độ không hợp lệ.");
                    return;
                }

                String programTitle = SecurityUtil.getString(body, "programTitle",
                    SecurityUtil.getString(body, "title", "Bài tập rèn luyện")).trim();
                String status = SecurityUtil.getString(body, "status", "COMPLETED").trim();
                double score = SecurityUtil.getDouble(body, "score", 8.5);
                String feedback = SecurityUtil.getString(body, "feedback",
                    SecurityUtil.getString(body, "trainerFeedback", "")).trim();
                String sessionTime = SecurityUtil.getString(body, "time",
                    SecurityUtil.getString(body, "sessionTime", "Hôm nay")).trim();

                Map<String, Object> newTel = new HashMap<>();
                newTel.put("id", System.currentTimeMillis());
                newTel.put("time", sessionTime);
                newTel.put("sessionTime", sessionTime);
                newTel.put("horse", SecurityUtil.sanitize(horse));
                newTel.put("horseName", SecurityUtil.sanitize(horse));
                newTel.put("programTitle", SecurityUtil.sanitize(programTitle));
                newTel.put("heartRate", heartRate);
                newTel.put("maxHeartRate", heartRate);
                newTel.put("speed", speed);
                newTel.put("avgSpeed", speed);
                newTel.put("distance", distance);
                newTel.put("distanceRun", distance);
                newTel.put("alert", heartRate >= 210);
                newTel.put("isOverLimit", heartRate >= 210);
                newTel.put("status", SecurityUtil.sanitize(status));
                newTel.put("score", score);
                newTel.put("feedback", SecurityUtil.sanitize(feedback));

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
                return;
            }

            // 4. POST /api/training/joint-sessions: Đặt lịch, Duyệt (confirm) hoặc Từ chối (reject) buổi tập chung
            if (path != null && path.startsWith("/api/training/joint-sessions")) {
                String pathInfo = request.getPathInfo();
                if (pathInfo != null && pathInfo.contains("/confirm")) {
                    String cleanId = pathInfo.replace("/confirm", "").replaceAll("^/+", "");
                    String feedback = SecurityUtil.getString(body, "feedback", "HLV đã xác nhận lịch tập.");
                    Map<String, Object> target = null;
                    synchronized (memoryJointSessions) {
                        for (Map<String, Object> s : memoryJointSessions) {
                            if (cleanId.equals(String.valueOf(s.get("id")))) {
                                s.put("status", "CONFIRMED");
                                s.put("trainerFeedback", feedback);
                                s.put("confirmedAt", new SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date()));
                                target = s;
                                break;
                            }
                        }
                    }
                    if (target != null) {
                        try (PrintWriter out = response.getWriter()) { out.print(gson.toJson(target)); out.flush(); }
                    } else {
                        SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy lịch tập cần duyệt.");
                    }
                    return;
                }

                if (pathInfo != null && pathInfo.contains("/reject")) {
                    String cleanId = pathInfo.replace("/reject", "").replaceAll("^/+", "");
                    String reason = SecurityUtil.getString(body, "reason", "HLV từ chối lịch tập.");
                    Map<String, Object> target = null;
                    synchronized (memoryJointSessions) {
                        for (Map<String, Object> s : memoryJointSessions) {
                            if (cleanId.equals(String.valueOf(s.get("id")))) {
                                s.put("status", "REJECTED");
                                s.put("trainerFeedback", reason);
                                s.put("rejectedAt", new SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date()));
                                target = s;
                                break;
                            }
                        }
                    }
                    if (target != null) {
                        try (PrintWriter out = response.getWriter()) { out.print(gson.toJson(target)); out.flush(); }
                    } else {
                        SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy lịch tập cần từ chối.");
                    }
                    return;
                }

                // Đặt lịch mới
                long newId = System.currentTimeMillis();
                Map<String, Object> session = new HashMap<>();
                session.put("id", newId);
                session.put("horseName", SecurityUtil.getString(body, "horseName", "Chiến mã"));
                session.put("microchip", SecurityUtil.getString(body, "microchip", ""));
                session.put("stall", SecurityUtil.getString(body, "stall", "Ô A1"));
                session.put("trainerUsername", SecurityUtil.getString(body, "trainerUsername", ""));
                session.put("trainerName", SecurityUtil.getString(body, "trainerName", ""));
                session.put("ownerName", SecurityUtil.getString(body, "ownerName", "Chủ sở hữu"));
                session.put("ownerKey", SecurityUtil.getString(body, "ownerKey", "owner"));
                session.put("sessionDate", SecurityUtil.getString(body, "sessionDate", ""));
                session.put("sessionTime", SecurityUtil.getString(body, "sessionTime", ""));
                session.put("goal", SecurityUtil.getString(body, "goal", "Tập luyện chung"));
                session.put("ownerNotes", SecurityUtil.getString(body, "ownerNotes", ""));
                session.put("status", "PENDING");
                session.put("createdAt", new SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date()));

                synchronized (memoryJointSessions) {
                    memoryJointSessions.add(0, session);
                }
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(session));
                    out.flush();
                }
                return;
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

    /**
     * DELETE /api/training/programs/{id}: Xóa giáo án huấn luyện
     * DELETE /api/training/telemetry/{id} hoặc /api/training/sessions/{id}: Xóa buổi tập
     */
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();
        User authUser;
        if (path != null && path.startsWith("/api/training/joint-sessions")) {
            authUser = SecurityUtil.requireRole(request, response, "OWNER", "TRAINER", "MANAGER", "ADMIN");
        } else {
            authUser = SecurityUtil.requireRole(request, response, "TRAINER", "MANAGER");
        }
        if (authUser == null) {
            return;
        }
        String pathInfo = request.getPathInfo();
        String targetId = "";

        if (pathInfo != null && pathInfo.length() > 1) {
            targetId = pathInfo.substring(1).trim();
        } else {
            targetId = request.getParameter("id");
        }

        if (targetId == null || targetId.isEmpty() || SecurityUtil.containsMaliciousPayload(targetId)) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Thiếu mã định danh cần xóa.");
            return;
        }

        final String idToDelete = targetId;
        boolean deleted = false;

        if (path.contains("programs")) {
            deleted = memoryPrograms.removeIf(p -> idToDelete.equals(String.valueOf(p.get("id"))));
        } else if (path.contains("joint-sessions")) {
            deleted = memoryJointSessions.removeIf(j -> idToDelete.equals(String.valueOf(j.get("id"))));
        } else {
            deleted = memoryTelemetry.removeIf(t -> idToDelete.equals(String.valueOf(t.get("id"))));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("deletedId", idToDelete);
        result.put("found", deleted);
        result.put("message", "Đã xóa thành công.");

        response.setStatus(HttpServletResponse.SC_OK);
        try (PrintWriter out = response.getWriter()) {
            out.print(gson.toJson(result));
            out.flush();
        }
    }
}
