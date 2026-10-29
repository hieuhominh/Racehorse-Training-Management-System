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
 */
@WebServlet(name = "GroomApiController", urlPatterns = {
    "/api/groom/assignments",
    "/api/groom/feeding",
    "/api/groom/feeding/*",
    "/api/groom/care-logs",
    "/api/groom/supplies"
})
public class GroomApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryFeeding = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryCareLogs = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memorySupplies = Collections.synchronizedList(new ArrayList<>());

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
    }

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/groom/assignments".equals(path)) {
                List<Map<String, Object>> stalls = new ArrayList<>();

                Map<String, Object> s1 = new HashMap<>();
                s1.put("stallCode", "A1");
                s1.put("horseName", "Xích Thố");
                s1.put("block", "Block A");
                s1.put("beddingStatus", "CLEAN");
                s1.put("lastMucked", "06:30 - Sáng nay");
                s1.put("waterBucketClean", true);
                stalls.add(s1);

                Map<String, Object> s2 = new HashMap<>();
                s2.put("stallCode", "A2");
                s2.put("horseName", "Bạch Long");
                s2.put("block", "Block A");
                s2.put("beddingStatus", "CLEAN");
                s2.put("lastMucked", "07:00 - Sáng nay");
                s2.put("waterBucketClean", true);
                stalls.add(s2);

                out.print(gson.toJson(stalls));
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

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu yêu cầu không hợp lệ.");
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

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu yêu cầu không hợp lệ.");
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
