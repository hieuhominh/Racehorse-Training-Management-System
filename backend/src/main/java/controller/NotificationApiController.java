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
 * Servlet API Quản lý Thông Báo Hệ Thống Toàn Diện (System Notifications)
 * Phục vụ liên thông thời gian thực giữa Chủ ngựa, HLV, Bác sĩ, Groom và Quản trị viên
 * Endpoints:
 * - GET    /api/notifications
 * - POST   /api/notifications
 * - PUT    /api/notifications/read
 * - DELETE /api/notifications/*
 * - DELETE /api/notifications/clear
 */
@WebServlet(name = "NotificationApiController", urlPatterns = {
    "/api/notifications",
    "/api/notifications/*",
    "/api/notifications/read",
    "/api/notifications/clear"
})
public class NotificationApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryNotifications = Collections.synchronizedList(new ArrayList<>());
    private final Gson gson = new Gson();

    static {
        // Thông báo khởi tạo mẫu đồng bộ với Client
        Map<String, Object> n1 = new HashMap<>();
        n1.put("id", 101L);
        n1.put("time", "08:30 Hôm nay");
        n1.put("timestamp", System.currentTimeMillis() - 3600000L);
        n1.put("type", "TRAINING_REQUEST");
        n1.put("title", "YÊU CẦU HUẤN LUYỆN CHIẾN MÃ");
        n1.put("message", "Chủ sở hữu Phạm Tiến Thành đã gửi yêu cầu chỉ định bạn làm Huấn luyện viên trưởng cho chiến mã \"Lôi Chấn\" (Ô A4, Chip: MC-VN-2022-088). Vui lòng thẩm định hồ sơ và xác nhận phục vụ.");
        n1.put("horseName", "Lôi Chấn");
        n1.put("horseId", 2);
        n1.put("microchip", "MC-VN-2022-088");
        n1.put("stable", "Ô A4");
        n1.put("ownerName", "Phạm Tiến Thành");
        n1.put("ownerKey", "owner_thanh");

        List<String> roles = new ArrayList<>();
        roles.add("TRAINER");
        roles.add("ADMIN");
        roles.add("ALL");
        n1.put("recipientRoles", roles);
        n1.put("readBy", new ArrayList<String>());

        memoryNotifications.add(n1);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String role = request.getParameter("role");
        String username = request.getParameter("username");

        try (PrintWriter out = response.getWriter()) {
            List<Map<String, Object>> result = new ArrayList<>();
            synchronized (memoryNotifications) {
                for (Map<String, Object> item : memoryNotifications) {
                    if (role == null || role.trim().isEmpty() || "ALL".equalsIgnoreCase(role)) {
                        result.add(item);
                        continue;
                    }
                    @SuppressWarnings("unchecked")
                    List<String> recipients = (List<String>) item.get("recipientRoles");
                    if (recipients == null || recipients.contains("ALL") || recipients.contains(role.toUpperCase())) {
                        result.add(item);
                    }
                }
            }
            out.print(gson.toJson(result));
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải danh sách thông báo hệ thống.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Dữ liệu JSON không hợp lệ.");
                return;
            }

            String title = SecurityUtil.getString(body, "title", "Thông báo hệ thống").trim();
            String message = SecurityUtil.getString(body, "message", "").trim();

            if (title.isEmpty() || message.isEmpty()) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Tiêu đề và nội dung thông báo không được để trống.");
                return;
            }

            if (SecurityUtil.containsMaliciousPayload(title) || SecurityUtil.containsMaliciousPayload(message)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Dữ liệu thông báo chứa ký tự không hợp lệ.");
                return;
            }

            Map<String, Object> notif = new HashMap<>();
            notif.put("id", System.currentTimeMillis());
            notif.put("time", SecurityUtil.getString(body, "time", "Vừa xong"));
            notif.put("timestamp", System.currentTimeMillis());
            notif.put("type", SecurityUtil.sanitize(SecurityUtil.getString(body, "type", "INFO")));
            notif.put("title", SecurityUtil.sanitize(title));
            notif.put("message", SecurityUtil.sanitize(message));
            notif.put("horseName", SecurityUtil.sanitize(SecurityUtil.getString(body, "horseName", "")));
            notif.put("horseId", SecurityUtil.getInt(body, "horseId", 0));
            notif.put("microchip", SecurityUtil.sanitize(SecurityUtil.getString(body, "microchip", "")));
            notif.put("stable", SecurityUtil.sanitize(SecurityUtil.getString(body, "stable", "")));
            notif.put("ownerName", SecurityUtil.sanitize(SecurityUtil.getString(body, "ownerName", "")));
            notif.put("ownerKey", SecurityUtil.sanitize(SecurityUtil.getString(body, "ownerKey", "")));

            List<String> roles = new ArrayList<>();
            if (body.has("recipientRoles") && body.get("recipientRoles").isJsonArray()) {
                body.getAsJsonArray("recipientRoles").forEach(el -> roles.add(el.getAsString().toUpperCase()));
            } else {
                roles.add("ALL");
            }
            notif.put("recipientRoles", roles);
            notif.put("readBy", new ArrayList<String>());

            memoryNotifications.add(0, notif);

            // Giới hạn 100 thông báo gần nhất
            if (memoryNotifications.size() > 100) {
                memoryNotifications.remove(memoryNotifications.size() - 1);
            }

            response.setStatus(HttpServletResponse.SC_CREATED);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(notif));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi tạo thông báo hệ thống.");
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Dữ liệu JSON không hợp lệ.");
                return;
            }

            String username = SecurityUtil.getString(body, "username", "ALL").trim();
            boolean markAll = SecurityUtil.getBoolean(body, "markAll", false);
            String notifIdStr = SecurityUtil.getString(body, "id", "").trim();

            synchronized (memoryNotifications) {
                for (Map<String, Object> item : memoryNotifications) {
                    @SuppressWarnings("unchecked")
                    List<String> readBy = (List<String>) item.get("readBy");
                    if (readBy == null) {
                        readBy = new ArrayList<>();
                        item.put("readBy", readBy);
                    }

                    if (markAll) {
                        if (!readBy.contains(username)) readBy.add(username);
                        if (!readBy.contains("ALL")) readBy.add("ALL");
                        item.put("isRead", true);
                    } else if (!notifIdStr.isEmpty() && String.valueOf(item.get("id")).equals(notifIdStr)) {
                        if (!readBy.contains(username)) readBy.add(username);
                        if (!readBy.contains("ALL")) readBy.add("ALL");
                        item.put("isRead", true);
                    }
                }
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã đánh dấu đã đọc thông báo.");

            response.setStatus(HttpServletResponse.SC_OK);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(res));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi khi đánh dấu đã đọc thông báo.");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        String path = request.getServletPath();

        if ("/api/notifications/clear".equals(path) || (pathInfo != null && pathInfo.contains("clear"))) {
            memoryNotifications.clear();
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã xóa toàn bộ thông báo.");
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(res));
                out.flush();
            }
            return;
        }

        if (pathInfo != null && pathInfo.length() > 1) {
            String idStr = pathInfo.substring(1).trim();
            memoryNotifications.removeIf(item -> idStr.equals(String.valueOf(item.get("id"))));
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("deletedId", idStr);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(res));
                out.flush();
            }
            return;
        }

        SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Thiếu ID thông báo cần xóa.");
    }
}

