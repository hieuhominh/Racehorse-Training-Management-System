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
    "/api/groom/stalls/*",
    "/api/groom/health-logs",
    "/api/groom/health-logs/*",
    "/api/groom/supply-requests",
    "/api/groom/supply-requests/*",
    "/api/groom/tasks",
    "/api/groom/tasks/*"
})
public class GroomApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryFeeding = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryCareLogs = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memorySupplies = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryRoutines = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryStalls = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryHealthLogs = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memorySupplyRequests = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryTasks = Collections.synchronizedList(new ArrayList<>());

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

        // Khởi tạo ô chuồng mặc định trống
        Map<String, Object> s1 = new HashMap<>();
        s1.put("code", "A1");
        s1.put("zone", "Block A");
        s1.put("horseName", "(Trống)");
        s1.put("breed", "Vacant");
        s1.put("microchip", "");
        s1.put("status", "AVAILABLE");
        s1.put("bedding", "Mùn cưa sạch");
        s1.put("beddingStatus", "GOOD");
        s1.put("waterLevel", "100%");
        s1.put("lastCleaned", "Sẵn sàng phân bổ");
        memoryStalls.add(s1);

        Map<String, Object> s2 = new HashMap<>();
        s2.put("code", "A2");
        s2.put("zone", "Block A");
        s2.put("horseName", "(Trống)");
        s2.put("breed", "Vacant");
        s2.put("microchip", "");
        s2.put("status", "AVAILABLE");
        s2.put("bedding", "Rơm khô mới thay");
        s2.put("beddingStatus", "GOOD");
        s2.put("waterLevel", "100%");
        s2.put("lastCleaned", "Sẵn sàng phân bổ");
        memoryStalls.add(s2);

        Map<String, Object> s3 = new HashMap<>();
        s3.put("code", "A3");
        s3.put("zone", "Block A");
        s3.put("horseName", "(Trống)");
        s3.put("breed", "Vacant");
        s3.put("microchip", "");
        s3.put("status", "AVAILABLE");
        s3.put("bedding", "Mùn cưa sạch");
        s3.put("beddingStatus", "GOOD");
        s3.put("waterLevel", "100%");
        s3.put("lastCleaned", "Sẵn sàng phân bổ");
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
                return;
            }

            if ("/api/groom/health-logs".equals(path) || path.startsWith("/api/groom/health-logs")) {
                synchronized (memoryHealthLogs) {
                    out.print(gson.toJson(memoryHealthLogs));
                }
                out.flush();
                return;
            }

            if ("/api/groom/supply-requests".equals(path) || path.startsWith("/api/groom/supply-requests")) {
                synchronized (memorySupplyRequests) {
                    out.print(gson.toJson(memorySupplyRequests));
                }
                out.flush();
                return;
            }

            if ("/api/groom/tasks".equals(path) || path.startsWith("/api/groom/tasks")) {
                synchronized (memoryTasks) {
                    out.print(gson.toJson(memoryTasks));
                }
                out.flush();
                return;
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

            if ("/api/groom/health-logs".equals(path) || path.startsWith("/api/groom/health-logs")) {
                String horseName = SecurityUtil.getString(body, "horseName", "Chiến mã");
                String temp = SecurityUtil.getString(body, "temp", "38.0°C");
                String pulse = SecurityUtil.getString(body, "pulse", "38 bpm");
                String respiration = SecurityUtil.getString(body, "respiration", "12 lần/phút");
                String appetite = SecurityUtil.getString(body, "appetite", "Rất tốt");
                String stool = SecurityUtil.getString(body, "stool", "Bình thường");
                String observation = SecurityUtil.getString(body, "observation", "");
                String time = SecurityUtil.getString(body, "time", "Vừa xong");
                String id = SecurityUtil.getString(body, "id", "HL-" + System.currentTimeMillis());

                Map<String, Object> log = new HashMap<>();
                log.put("id", id);
                log.put("horseName", SecurityUtil.sanitize(horseName));
                log.put("temp", SecurityUtil.sanitize(temp));
                log.put("pulse", SecurityUtil.sanitize(pulse));
                log.put("respiration", SecurityUtil.sanitize(respiration));
                log.put("appetite", SecurityUtil.sanitize(appetite));
                log.put("stool", SecurityUtil.sanitize(stool));
                log.put("observation", SecurityUtil.sanitize(observation));
                log.put("time", SecurityUtil.sanitize(time));
                log.put("userCreated", true);
                log.put("recordedBy", authUser.getFullName());
                log.put("createdAt", System.currentTimeMillis());

                if (body.has("rawAppetite")) log.put("rawAppetite", body.get("rawAppetite").getAsString());
                if (body.has("rawStool")) log.put("rawStool", body.get("rawStool").getAsString());
                if (body.has("rawUrine")) log.put("rawUrine", body.get("rawUrine").getAsString());
                if (body.has("mucous")) log.put("mucous", body.get("mucous").getAsString());
                if (body.has("crt")) log.put("crt", body.get("crt").getAsString());
                if (body.has("gutSounds")) log.put("gutSounds", body.get("gutSounds").getAsString());
                if (body.has("gait")) log.put("gait", body.get("gait").getAsString());
                if (body.has("tendon")) log.put("tendon", body.get("tendon").getAsString());

                synchronized (memoryHealthLogs) {
                    memoryHealthLogs.add(0, log);
                }

                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(log));
                    out.flush();
                }
                return;
            }

            if ("/api/groom/supply-requests".equals(path) || path.startsWith("/api/groom/supply-requests")) {
                String supplyName = SecurityUtil.getString(body, "supplyName", "Lương thực / Vật tư");
                String supplyId = SecurityUtil.getString(body, "supplyId", "INV-" + (System.currentTimeMillis() % 1000));
                String category = SecurityUtil.getString(body, "category", "FEED");
                String qty = SecurityUtil.getString(body, "qty", "Dưới 15%");
                int percent = SecurityUtil.getInt(body, "percent", 12);
                String requestedBy = SecurityUtil.getString(body, "requestedBy", authUser.getFullName());
                String id = SecurityUtil.getString(body, "id", "SR-" + System.currentTimeMillis());

                Map<String, Object> req = new HashMap<>();
                req.put("id", id);
                req.put("supplyId", SecurityUtil.sanitize(supplyId));
                req.put("supplyName", SecurityUtil.sanitize(supplyName));
                req.put("category", SecurityUtil.sanitize(category));
                req.put("qty", SecurityUtil.sanitize(qty));
                req.put("percent", percent);
                req.put("requestedBy", SecurityUtil.sanitize(requestedBy));
                req.put("requestedAt", "Hôm nay");
                req.put("status", "PENDING_ADMIN");

                synchronized (memorySupplyRequests) {
                    memorySupplyRequests.add(0, req);
                }

                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(req));
                    out.flush();
                }
                return;
            }

            if ("/api/groom/tasks".equals(path) || path.startsWith("/api/groom/tasks")) {
                String title = SecurityUtil.getString(body, "title", "Công việc chăm sóc");
                String desc = SecurityUtil.getString(body, "desc", "");
                String horseName = SecurityUtil.getString(body, "horseName", "Chiến mã");
                String horseId = SecurityUtil.getString(body, "horseId", "");
                String stall = SecurityUtil.getString(body, "stall", "Ô chuồng");
                String groom = SecurityUtil.getString(body, "groom", authUser.getFullName());
                String groomId = SecurityUtil.getString(body, "groomId", authUser.getUsername());
                String time = SecurityUtil.getString(body, "time", "08:00");
                String type = SecurityUtil.getString(body, "type", "DAILY_CARE");
                String dateKey = SecurityUtil.getString(body, "dateKey", "TODAY");
                String id = SecurityUtil.getString(body, "id", "TASK-" + System.currentTimeMillis());

                Map<String, Object> taskItem = new HashMap<>();
                taskItem.put("id", id);
                taskItem.put("title", SecurityUtil.sanitize(title));
                taskItem.put("desc", SecurityUtil.sanitize(desc));
                taskItem.put("horseName", SecurityUtil.sanitize(horseName));
                taskItem.put("horseId", SecurityUtil.sanitize(horseId));
                taskItem.put("stall", SecurityUtil.sanitize(stall));
                taskItem.put("groom", SecurityUtil.sanitize(groom));
                taskItem.put("groomId", SecurityUtil.sanitize(groomId));
                taskItem.put("time", SecurityUtil.sanitize(time));
                taskItem.put("type", SecurityUtil.sanitize(type));
                taskItem.put("dateKey", SecurityUtil.sanitize(dateKey));
                taskItem.put("status", "PENDING");

                synchronized (memoryTasks) {
                    memoryTasks.add(0, taskItem);
                }

                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(taskItem));
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

            if ("/api/groom/supplies".equals(request.getServletPath())) {
                String supplyName = SecurityUtil.getString(body, "supplyName", task).trim();
                String quantity = SecurityUtil.getString(body, "quantity", "1").trim();
                Map<String, Object> req = new HashMap<>();
                req.put("id", System.currentTimeMillis());
                req.put("supplyName", SecurityUtil.sanitize(supplyName));
                req.put("quantity", SecurityUtil.sanitize(quantity));
                req.put("status", "SUBMITTED");
                req.put("date", "Hôm nay");
                req.put("requestedBy", authUser.getFullName());
                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(req));
                    out.flush();
                }
                return;
            }

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

            if ("/api/groom/health-logs".equals(path) || path.startsWith("/api/groom/health-logs")) {
                String id = "";
                String pathInfo = request.getPathInfo();
                if (pathInfo != null && pathInfo.length() > 1) {
                    id = pathInfo.substring(1).trim();
                } else {
                    id = SecurityUtil.getString(body, "id", "");
                }

                Map<String, Object> target = null;
                synchronized (memoryHealthLogs) {
                    for (Map<String, Object> log : memoryHealthLogs) {
                        if (String.valueOf(log.get("id")).equalsIgnoreCase(id)) {
                            target = log;
                            break;
                        }
                    }
                }

                if (target == null) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy bản ghi sức khỏe.");
                    return;
                }

                if (body.has("temp")) target.put("temp", SecurityUtil.sanitize(body.get("temp").getAsString()));
                if (body.has("pulse")) target.put("pulse", SecurityUtil.sanitize(body.get("pulse").getAsString()));
                if (body.has("respiration")) target.put("respiration", SecurityUtil.sanitize(body.get("respiration").getAsString()));
                if (body.has("appetite")) target.put("appetite", SecurityUtil.sanitize(body.get("appetite").getAsString()));
                if (body.has("stool")) target.put("stool", SecurityUtil.sanitize(body.get("stool").getAsString()));
                if (body.has("observation")) target.put("observation", SecurityUtil.sanitize(body.get("observation").getAsString()));
                if (body.has("time")) target.put("time", SecurityUtil.sanitize(body.get("time").getAsString()));
                if (body.has("rawAppetite")) target.put("rawAppetite", body.get("rawAppetite").getAsString());
                if (body.has("rawStool")) target.put("rawStool", body.get("rawStool").getAsString());
                if (body.has("rawUrine")) target.put("rawUrine", body.get("rawUrine").getAsString());
                if (body.has("mucous")) target.put("mucous", body.get("mucous").getAsString());
                if (body.has("crt")) target.put("crt", body.get("crt").getAsString());
                if (body.has("gutSounds")) target.put("gutSounds", body.get("gutSounds").getAsString());
                if (body.has("gait")) target.put("gait", body.get("gait").getAsString());
                if (body.has("tendon")) target.put("tendon", body.get("tendon").getAsString());
                target.put("updatedAt", System.currentTimeMillis());

                response.setStatus(HttpServletResponse.SC_OK);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(target));
                    out.flush();
                }
                return;
            }

            if ("/api/groom/supply-requests".equals(path) || path.startsWith("/api/groom/supply-requests")) {
                String id = "";
                String pathInfo = request.getPathInfo();
                if (pathInfo != null && pathInfo.length() > 1) {
                    id = pathInfo.substring(1).trim();
                } else {
                    id = SecurityUtil.getString(body, "id", "");
                }

                Map<String, Object> target = null;
                synchronized (memorySupplyRequests) {
                    for (Map<String, Object> req : memorySupplyRequests) {
                        if (String.valueOf(req.get("id")).equalsIgnoreCase(id)) {
                            target = req;
                            break;
                        }
                    }
                }

                if (target == null) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy yêu cầu cấp phát.");
                    return;
                }

                if (body.has("status")) target.put("status", SecurityUtil.sanitize(body.get("status").getAsString()));
                if (body.has("adminNote")) target.put("adminNote", SecurityUtil.sanitize(body.get("adminNote").getAsString()));
                target.put("approvedBy", authUser.getFullName());
                target.put("reviewedAt", System.currentTimeMillis());

                response.setStatus(HttpServletResponse.SC_OK);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(target));
                    out.flush();
                }
                return;
            }

            if ("/api/groom/tasks".equals(path) || path.startsWith("/api/groom/tasks")) {
                String id = "";
                String pathInfo = request.getPathInfo();
                if (pathInfo != null && pathInfo.length() > 1) {
                    id = pathInfo.substring(1).trim();
                } else {
                    id = SecurityUtil.getString(body, "id", "");
                }

                Map<String, Object> target = null;
                synchronized (memoryTasks) {
                    for (Map<String, Object> t : memoryTasks) {
                        if (String.valueOf(t.get("id")).equalsIgnoreCase(id)) {
                            target = t;
                            break;
                        }
                    }
                }

                if (target == null) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy công việc.");
                    return;
                }

                if (body.has("status")) target.put("status", SecurityUtil.sanitize(body.get("status").getAsString()));
                if (body.has("completedAt")) target.put("completedAt", SecurityUtil.sanitize(body.get("completedAt").getAsString()));
                target.put("updatedAt", System.currentTimeMillis());

                response.setStatus(HttpServletResponse.SC_OK);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(target));
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

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "GROOM", "TRAINER", "MANAGER", "ADMIN");
        if (authUser == null) {
            return;
        }

        String path = request.getServletPath();

        try {
            String pathInfo = request.getPathInfo();
            String id = (pathInfo != null && pathInfo.length() > 1) ? pathInfo.substring(1).trim() : request.getParameter("id");

            if ("/api/groom/health-logs".equals(path) || path.startsWith("/api/groom/health-logs")) {
                synchronized (memoryHealthLogs) {
                    if (id == null || id.isEmpty() || "ALL".equalsIgnoreCase(id)) {
                        memoryHealthLogs.clear();
                    } else {
                        memoryHealthLogs.removeIf(log -> String.valueOf(log.get("id")).equalsIgnoreCase(id));
                    }
                }
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Đã xóa bản ghi sức khỏe.");
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(res));
                    out.flush();
                }
                return;
            }

            if ("/api/groom/tasks".equals(path) || path.startsWith("/api/groom/tasks")) {
                synchronized (memoryTasks) {
                    if (id != null && !id.isEmpty()) {
                        memoryTasks.removeIf(t -> String.valueOf(t.get("id")).equalsIgnoreCase(id));
                    }
                }
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Đã xóa công việc.");
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(res));
                    out.flush();
                }
                return;
            }

            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Yêu cầu xóa không hợp lệ.");
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Lỗi máy chủ khi xóa dữ liệu.");
        }
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPut(req, resp);
        } else {
            super.service(req, resp);
        }
    }
}
