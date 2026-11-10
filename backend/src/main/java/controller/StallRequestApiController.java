package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.StableDAO;
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

/**
 * Servlet API Quản lý Yêu cầu Cấp & Đổi Ô Chuồng (Stall Request Management API)
 * Phục vụ Chủ sở hữu ngựa gửi yêu cầu và Quản trị viên (Admin) thẩm định, phê duyệt hoặc từ chối.
 * Endpoints:
 * - GET  /api/stables/requests
 * - POST /api/stables/requests
 * - POST /api/stables/requests/{id}/approve
 * - POST /api/stables/requests/{id}/reject
 */
@WebServlet(name = "StallRequestApiController", urlPatterns = {
    "/api/stables/requests",
    "/api/stables/requests/*"
})
public class StallRequestApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryRequests = Collections.synchronizedList(new ArrayList<>());
    private final StableDAO stableDAO = new StableDAO();
    private final Gson gson = new Gson();

    static {
        // Dữ liệu mẫu khởi tạo cho yêu cầu chuồng trại
        Map<String, Object> seed1 = new HashMap<>();
        seed1.put("id", 1);
        seed1.put("time", "07:13 Hôm nay");
        seed1.put("owner", "Hồ Minh Hiếu");
        seed1.put("ownerUsername", "hominhieu27072005");
        seed1.put("horse", "Chiến mã Nhi Khùng");
        seed1.put("horseBreed", "Quarter Horse");
        seed1.put("horseAvatar", "/images/horse_simulation_card.jpg");
        seed1.put("type", "ĐỔI Ô CHUỒNG");
        seed1.put("targetStall", "Ô B1");
        seed1.put("currentStall", "Ô A2");
        seed1.put("reason", "Mong muốn chuyển gần chuồng tiện chăm sóc theo dõi");
        seed1.put("status", "APPROVED");
        seed1.put("approvedBy", "Admin Quản Trị");
        seed1.put("createdAt", System.currentTimeMillis() - 3600000L);
        memoryRequests.add(seed1);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String statusFilter = request.getParameter("status");
        String ownerFilter = request.getParameter("owner");

        try (PrintWriter out = response.getWriter()) {
            List<Map<String, Object>> result = new ArrayList<>();
            synchronized (memoryRequests) {
                for (Map<String, Object> req : memoryRequests) {
                    if (statusFilter != null && !statusFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusFilter)) {
                        String reqStatus = String.valueOf(req.get("status"));
                        if (!statusFilter.equalsIgnoreCase(reqStatus)) {
                            continue;
                        }
                    }
                    if (ownerFilter != null && !ownerFilter.trim().isEmpty()) {
                        String reqOwner = String.valueOf(req.get("ownerUsername"));
                        if (!ownerFilter.equalsIgnoreCase(reqOwner)) {
                            continue;
                        }
                    }
                    result.add(req);
                }
            }
            out.print(gson.toJson(result));
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải danh sách yêu cầu cấp đổi ô chuồng.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();

        // 1. Phê duyệt yêu cầu: POST /api/stables/requests/{id}/approve
        if (pathInfo != null && pathInfo.endsWith("/approve")) {
            User admin = SecurityUtil.requireRole(request, response, "MANAGER");
            if (admin == null) return;

            String[] parts = pathInfo.split("/");
            // pathInfo dạng: /1/approve -> parts[0]="", parts[1]="1", parts[2]="approve"
            if (parts.length >= 2) {
                String reqIdStr = parts[1];
                Map<String, Object> target = null;
                synchronized (memoryRequests) {
                    for (Map<String, Object> req : memoryRequests) {
                        if (reqIdStr.equals(String.valueOf(req.get("id")))) {
                            target = req;
                            req.put("status", "APPROVED");
                            req.put("approvedBy", admin.getFullName() != null ? admin.getFullName() : "Admin Quản trị");
                            break;
                        }
                    }
                }

                if (target != null) {
                    // Thực hiện gán ngựa vào ô chuồng mới và giải phóng ô cũ
                    String targetStall = String.valueOf(target.get("targetStall")).replace("Ô ", "").trim();
                    String currentStall = target.get("currentStall") != null ? String.valueOf(target.get("currentStall")).replace("Ô ", "").trim() : "";
                    String horseName = String.valueOf(target.get("horse"));
                    String horseBreed = String.valueOf(target.get("horseBreed"));

                    if (!targetStall.isEmpty()) {
                        stableDAO.reassignHorseToStall(targetStall, null, horseName, horseBreed);
                    }
                    if (!currentStall.isEmpty() && !currentStall.equalsIgnoreCase(targetStall)) {
                        stableDAO.reassignHorseToStall(currentStall, null, "(Trống)", "Vacant");
                    }

                    JsonObject res = new JsonObject();
                    res.addProperty("success", true);
                    res.addProperty("message", "Đã phê duyệt yêu cầu cấp đổi chuồng thành công!");
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(res));
                        out.flush();
                    }
                    return;
                }
            }
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy yêu cầu cần phê duyệt.");
            return;
        }

        // 2. Từ chối yêu cầu: POST /api/stables/requests/{id}/reject
        if (pathInfo != null && pathInfo.endsWith("/reject")) {
            User admin = SecurityUtil.requireRole(request, response, "MANAGER");
            if (admin == null) return;

            String[] parts = pathInfo.split("/");
            if (parts.length >= 2) {
                String reqIdStr = parts[1];
                JsonObject body = SecurityUtil.parseJsonObject(request);
                String reason = body != null ? SecurityUtil.getString(body, "reason", "Không đủ điều kiện phân bổ") : "Không đủ điều kiện phân bổ";

                Map<String, Object> target = null;
                synchronized (memoryRequests) {
                    for (Map<String, Object> req : memoryRequests) {
                        if (reqIdStr.equals(String.valueOf(req.get("id")))) {
                            target = req;
                            req.put("status", "REJECTED");
                            req.put("rejectReason", reason);
                            req.put("approvedBy", admin.getFullName() != null ? admin.getFullName() : "Admin Quản trị");
                            break;
                        }
                    }
                }

                if (target != null) {
                    JsonObject res = new JsonObject();
                    res.addProperty("success", true);
                    res.addProperty("message", "Đã từ chối yêu cầu cấp đổi chuồng.");
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(res));
                        out.flush();
                    }
                    return;
                }
            }
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy yêu cầu cần từ chối.");
            return;
        }

        // 3. Tạo yêu cầu mới: POST /api/stables/requests
        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Dữ liệu JSON không hợp lệ.");
                return;
            }

            String ownerKey = SecurityUtil.getString(body, "ownerKey", "owner").trim();
            String ownerName = SecurityUtil.getString(body, "ownerName", ownerKey).trim();
            String horseName = SecurityUtil.getString(body, "horseName", "").trim();
            String horseBreed = SecurityUtil.getString(body, "horseBreed", "Thoroughbred").trim();
            String requestType = SecurityUtil.getString(body, "requestType", "ĐỔI Ô CHUỒNG").trim();
            String requestedStall = SecurityUtil.getString(body, "requestedStall", "").trim();
            String currentStall = SecurityUtil.getString(body, "currentStall", "(Chưa có)").trim();
            String reason = SecurityUtil.getString(body, "reason", "Yêu cầu từ Chủ sở hữu").trim();

            if (horseName.isEmpty() || requestedStall.isEmpty()) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Vui lòng cung cấp tên chiến mã và ô chuồng mong muốn.");
                return;
            }

            Map<String, Object> newReq = new HashMap<>();
            long id = System.currentTimeMillis();
            newReq.put("id", id);
            newReq.put("time", new SimpleDateFormat("HH:mm dd-MM").format(new Date()));
            newReq.put("owner", ownerName);
            newReq.put("ownerUsername", ownerKey);
            newReq.put("horse", horseName);
            newReq.put("horseBreed", horseBreed);
            newReq.put("horseAvatar", "/images/horse_simulation_card.jpg");
            newReq.put("type", requestType);
            newReq.put("targetStall", requestedStall.startsWith("Ô ") ? requestedStall : ("Ô " + requestedStall));
            newReq.put("currentStall", currentStall.startsWith("Ô ") || currentStall.equals("(Chưa có)") ? currentStall : ("Ô " + currentStall));
            newReq.put("reason", reason);
            newReq.put("status", "PENDING");
            newReq.put("createdAt", id);

            memoryRequests.add(0, newReq);

            response.setStatus(HttpServletResponse.SC_CREATED);
            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.addProperty("message", "Đã gửi yêu cầu cấp đổi ô chuồng thành công. Vui lòng chờ Admin thẩm định!");
            res.add("request", gson.toJsonTree(newReq));

            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(res));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Lỗi khi gửi yêu cầu chuồng trại.");
        }
    }
}

