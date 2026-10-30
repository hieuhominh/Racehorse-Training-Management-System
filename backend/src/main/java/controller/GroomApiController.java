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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servlet API dành riêng cho Nhân viên Chăm sóc (Groom Portal API)
 * Endpoints:
 * - GET /api/groom/assignments
 * - GET, PUT /api/groom/feeding, /api/groom/feeding/*
 * - GET, POST /api/groom/care-logs
 * - GET, POST /api/groom/supplies
 * - GET, POST, PUT /api/groom/routines, /api/groom/routines/*
 * - GET, POST, PUT /api/groom/stalls, /api/groom/stalls/*
 */
@WebServlet(name = "GroomApiController", urlPatterns = {
    "/api/groom/assignments",
    "/api/groom/feeding",
    "/api/groom/feeding/*",
    "/api/groom/care-logs",
    "/api/groom/supplies",
    "/api/groom/routines",
    "/api/groom/routines/*",
    "/api/groom/stalls",
    "/api/groom/stalls/*"
})
public class GroomApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryFeeding = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryCareLogs = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memorySupplies = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryRoutines = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryStalls = Collections.synchronizedList(new ArrayList<>());

    static {
        Map<String, Object> f1 = new HashMap<>();
        f1.put("id", 1);
        f1.put("meal", "Bữa Sáng (06:00)");
        f1.put("ration", "3.5kg Yến mạch + 5kg Cỏ Timothy + Điện giải");
        f1.put("status", "COMPLETED");
        f1.put("timeCompleted", "06:15");
        memoryFeeding.add(f1);

        Map<String, Object> f2 = new HashMap<>();
        f2.put("id", 2);
        f2.put("meal", "Bữa Trưa (11:30)");
        f2.put("ration", "4kg Cỏ tươi Alfalfa + Men tiêu hóa");
        f2.put("status", "PENDING");
        f2.put("timeCompleted", null);
        memoryFeeding.add(f2);

        Map<String, Object> c1 = new HashMap<>();
        c1.put("id", 1);
        c1.put("task", "Tắm xả cơ bắp bằng vòi lạnh & sấy khô");
        c1.put("horseName", "Bạch Long");
        c1.put("groomName", "Lê Hoàng Nam");
        c1.put("date", "24/10/2026");
        c1.put("status", "DONE");
        memoryCareLogs.add(c1);

        Map<String, Object> sp1 = new HashMap<>();
        sp1.put("name", "Rơm lót chuồng khử khuẩn");
        sp1.put("inStock", "45 bao");
        sp1.put("minAlert", "10 bao");
        sp1.put("status", "SUFFICIENT");
        memorySupplies.add(sp1);

        // Khởi tạo checklist chăm sóc mẫu
        Map<String, Object> r1 = new HashMap<>();
        r1.put("id", 1);
        r1.put("time", "06:00");
        r1.put("title", "Bữa sáng & Cấp nước");
        r1.put("desc", "Cấp cỏ khô Alfalfa (4kg/con), yến mạch ngâm nở và kiểm tra phao nước tự động.");
        r1.put("completed", true);
        r1.put("completedAt", "06:25");
        memoryRoutines.add(r1);

        Map<String, Object> r2 = new HashMap<>();
        r2.put("id", 2);
        r2.put("time", "08:00");
        r2.put("title", "Chải lông & Cạo móng");
        r2.put("desc", "Dùng lược Curry chải sạch bụi cát, dao Hoof pick nạo sạch sỏi đá bám kẽ móng guốc.");
        r2.put("completed", true);
        r2.put("completedAt", "08:40");
        memoryRoutines.add(r2);

        Map<String, Object> r3 = new HashMap<>();
        r3.put("id", 3);
        r3.put("time", "11:30");
        r3.put("title", "Bữa trưa & Điện giải");
        r3.put("desc", "Khẩu phần cỏ tươi, cám đậm đặc và bổ sung điện giải chống mất nước do nắng nóng.");
        r3.put("completed", true);
        r3.put("completedAt", "11:45");
        memoryRoutines.add(r3);

        Map<String, Object> r4 = new HashMap<>();
        r4.put("id", 4);
        r4.put("time", "15:30");
        r4.put("title", "Hạ nhiệt & Ngâm chân đá Cryo");
        r4.put("desc", "Đón ngựa sau giờ tập của HLV, xịt nước làm mát gân chân và mang ủng đá lạnh 20 phút.");
        r4.put("completed", true);
        r4.put("completedAt", "16:05");
        memoryRoutines.add(r4);

        Map<String, Object> r5 = new HashMap<>();
        r5.put("id", 5);
        r5.put("time", "18:00");
        r5.put("title", "Bữa tối & Khóa an toàn ban đêm");
        r5.put("desc", "Cho ăn cỏ khô bữa tối, dọn sạch phân tồn đọng, khóa chốt an toàn cửa chuồng.");
        r5.put("completed", false);
        r5.put("completedAt", null);
        memoryRoutines.add(r5);

        // Khởi tạo ô chuồng mẫu
        Map<String, Object> s1 = new HashMap<>();
        s1.put("code", "A1");
        s1.put("zone", "Block A");
        s1.put("horseName", "Xích Thố");
        s1.put("breed", "Thoroughbred");
        s1.put("microchip", "MC-VN-2023-001");
        s1.put("status", "NORMAL");
        s1.put("bedding", "Mùn cưa sạch");
        s1.put("beddingStatus", "GOOD");
        s1.put("waterLevel", "100%");
        s1.put("lastCleaned", "07:30 Sáng nay");
        memoryStalls.add(s1);

        Map<String, Object> s2 = new HashMap<>();
        s2.put("code", "A2");
        s2.put("zone", "Block A");
        s2.put("horseName", "Bạch Long");
        s2.put("breed", "Thoroughbred");
        s2.put("microchip", "MC-VN-2024-003");
        s2.put("status", "NORMAL");
        s2.put("bedding", "Rơm khô mới thay");
        s2.put("beddingStatus", "GOOD");
        s2.put("waterLevel", "85%");
        s2.put("lastCleaned", "08:00 Sáng nay");
        memoryStalls.add(s2);

        Map<String, Object> s3 = new HashMap<>();
        s3.put("code", "A3");
        s3.put("zone", "Block A");
        s3.put("horseName", "Hắc Phong");
        s3.put("breed", "Arabian");
        s3.put("microchip", "MC-VN-2022-001");
        s3.put("status", "WATCH_HEALTH");
        s3.put("bedding", "Mùn cưa cần thay");
        s3.put("beddingStatus", "NEEDS_CLEAN");
        s3.put("waterLevel", "60%");
        s3.put("lastCleaned", "Hôm qua");
        memoryStalls.add(s3);
    }

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/groom/routines".equals(path) || path.startsWith("/api/groom/routines")) {
                synchronized (memoryRoutines) {
                    out.print(gson.toJson(memoryRoutines));
                }
                out.flush();
                return;
            }

            if ("/api/groom/stalls".equals(path) || path.startsWith("/api/groom/stalls")) {
                synchronized (memoryStalls) {
                    out.print(gson.toJson(memoryStalls));
                }
                out.flush();
                return;
            }

            if ("/api/groom/assignments".equals(path)) {
                synchronized (memoryStalls) {
                    out.print(gson.toJson(memoryStalls));
                }
                out.flush();
                return;
            }

            if ("/api/groom/feeding".equals(path)) {
                synchronized (memoryFeeding) {
                    out.print(gson.toJson(memoryFeeding));
                }
                out.flush();
                return;
            }

            if ("/api/groom/care-logs".equals(path)) {
                synchronized (memoryCareLogs) {
                    out.print(gson.toJson(memoryCareLogs));
                }
                out.flush();
                return;
            }

            if ("/api/groom/supplies".equals(path)) {
                synchronized (memorySupplies) {
                    out.print(gson.toJson(memorySupplies));
                }
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải dữ liệu chăm sóc chuồng trại.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "GROOM", "TRAINER", "MANAGER");
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

            if ("/api/groom/routines".equals(path) || path.startsWith("/api/groom/routines")) {
                int id = SecurityUtil.getInt(body, "id", -1);
                boolean completed = SecurityUtil.getBoolean(body, "completed", true);

                synchronized (memoryRoutines) {
                    for (Map<String, Object> r : memoryRoutines) {
                        if (String.valueOf(r.get("id")).equals(String.valueOf(id))) {
                            r.put("completed", completed);
                            r.put("completedAt", completed ? "Vừa xong" : null);
                            break;
                        }
                    }
                }

                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Đã cập nhật checklist chăm sóc.");
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(res));
                    out.flush();
                }
                return;
            }

            if ("/api/groom/stalls".equals(path) || path.startsWith("/api/groom/stalls")) {
                String stallCode = SecurityUtil.getString(body, "stallCode", SecurityUtil.getString(body, "code", ""));

                synchronized (memoryStalls) {
                    for (Map<String, Object> s : memoryStalls) {
                        if (stallCode.equalsIgnoreCase((String) s.get("code"))) {
                            s.put("bedding", "Mùn cưa mới thay");
                            s.put("beddingStatus", "GOOD");
                            s.put("lastCleaned", "Vừa xong");
                            break;
                        }
                    }
                }

                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Đã ghi nhận vệ sinh ô chuồng.");
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(res));
                    out.flush();
                }
                return;
            }

            String task = SecurityUtil.getString(body, "task",
                SecurityUtil.getString(body, "supplyName", "")).trim();
            if (SecurityUtil.containsMaliciousPayload(task)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Nội dung chứa ký tự không hợp lệ.");
                return;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("id", System.currentTimeMillis());
            result.put("task", SecurityUtil.sanitize(task));
            result.put("horseName", SecurityUtil.sanitize(SecurityUtil.getString(body, "horseName", "")));
            result.put("groomName", authUser.getFullName());
            result.put("success", true);
            result.put("recordedAt", System.currentTimeMillis());

            if ("/api/groom/care-logs".equals(request.getServletPath())) {
                memoryCareLogs.add(0, result);
            }

            response.setStatus(HttpServletResponse.SC_CREATED);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(result));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi ghi nhận công việc chăm sóc.");
        }
    }

    /**
     * PUT /api/groom/feeding/{id}: Cập nhật trạng thái cho ăn theo lịch trình
     */
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "GROOM", "TRAINER", "MANAGER");
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

            if ("/api/groom/routines".equals(path) || path.startsWith("/api/groom/routines")) {
                int id = SecurityUtil.getInt(body, "id", -1);
                boolean completed = SecurityUtil.getBoolean(body, "completed", true);

                synchronized (memoryRoutines) {
                    for (Map<String, Object> r : memoryRoutines) {
                        if (String.valueOf(r.get("id")).equals(String.valueOf(id))) {
                            r.put("completed", completed);
                            r.put("completedAt", completed ? "Vừa xong" : null);
                            break;
                        }
                    }
                }

                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Đã cập nhật checklist chăm sóc.");
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(res));
                    out.flush();
                }
                return;
            }

            if ("/api/groom/stalls".equals(path) || path.startsWith("/api/groom/stalls")) {
                String stallCode = SecurityUtil.getString(body, "stallCode", SecurityUtil.getString(body, "code", ""));

                synchronized (memoryStalls) {
                    for (Map<String, Object> s : memoryStalls) {
                        if (stallCode.equalsIgnoreCase((String) s.get("code"))) {
                            s.put("bedding", "Mùn cưa mới thay");
                            s.put("beddingStatus", "GOOD");
                            s.put("lastCleaned", "Vừa xong");
                            break;
                        }
                    }
                }

                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Đã ghi nhận vệ sinh ô chuồng.");
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(res));
                    out.flush();
                }
                return;
            }

            int scheduleId = -1;
            String pathInfo = request.getPathInfo();
            if (pathInfo != null && pathInfo.length() > 1) {
                try {
                    scheduleId = Integer.parseInt(pathInfo.substring(1).trim());
                } catch (NumberFormatException e) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Mã lịch cho ăn không hợp lệ.");
                    return;
                }
            } else {
                scheduleId = SecurityUtil.getInt(body, "id", SecurityUtil.getInt(body, "scheduleId", -1));
            }

            if (scheduleId <= 0) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thiếu mã lịch cho ăn cần cập nhật.");
                return;
            }

            boolean isCompleted = SecurityUtil.getBoolean(body, "isCompleted", true);
            Map<String, Object> updatedItem = null;

            synchronized (memoryFeeding) {
                for (Map<String, Object> item : memoryFeeding) {
                    if (String.valueOf(scheduleId).equals(String.valueOf(item.get("id")))) {
                        item.put("status", isCompleted ? "COMPLETED" : "PENDING");
                        item.put("timeCompleted", isCompleted ? " Đã hoàn tất" : null);
                        updatedItem = item;
                        break;
                    }
                }
            }

            if (updatedItem == null) {
                updatedItem = new HashMap<>();
                updatedItem.put("id", scheduleId);
                updatedItem.put("status", isCompleted ? "COMPLETED" : "PENDING");
            }
            updatedItem.put("success", true);

            response.setStatus(HttpServletResponse.SC_OK);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(updatedItem));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi cập nhật khẩu phần ăn.");
        }
    }
}
