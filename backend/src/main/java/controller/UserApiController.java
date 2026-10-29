package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.HorseDAO;
import dal.IncidentDAO;
import dal.StableDAO;
import dal.UserDAO;
import model.Horse;
import model.Incident;
import model.Stable;
import model.User;
import util.SecurityUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servlet API Quản lý Người dùng & Tổng quan Hệ thống dành cho Admin (MANAGER)
 * Endpoints: /api/users, /api/users/*, /api/admin/overview
 */
@WebServlet(name = "UserApiController", urlPatterns = {
    "/api/users",
    "/api/users/*",
    "/api/admin/overview"
})
public class UserApiController extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();
    private final HorseDAO horseDAO = new HorseDAO();
    private final StableDAO stableDAO = new StableDAO();
    private final IncidentDAO incidentDAO = new IncidentDAO();
    private final Gson gson = new Gson();

    /**
     * GET /api/admin/overview: Lấy chỉ số tổng quan cho trang Admin
     * GET /api/users: Lấy danh sách toàn bộ người dùng
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User admin = SecurityUtil.requireRole(request, response, "MANAGER");
        if (admin == null) {
            return;
        }

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/admin/overview".equals(path)) {
                List<Horse> horses = horseDAO.getAllHorses();
                List<Stable> stables = stableDAO.getAllStables();
                List<User> users = userDAO.getAllUsers();
                List<Incident> incidents = incidentDAO.getAllIncidents();

                long eligibleHorses = horses.stream()
                    .filter(h -> !h.isTrainingLocked() && ("ELIGIBLE".equalsIgnoreCase(h.getHealthStatus()) || "GOOD".equalsIgnoreCase(h.getHealthStatus())))
                    .count();
                long lockedHorses = horses.stream().filter(Horse::isTrainingLocked).count();
                long occupiedStalls = stables.stream().filter(s -> "OCCUPIED".equalsIgnoreCase(s.getStatus())).count();
                long availableStalls = stables.stream().filter(s -> "AVAILABLE".equalsIgnoreCase(s.getStatus())).count();
                long activeIncidents = incidents.stream().filter(i -> !"RESOLVED".equalsIgnoreCase(i.getStatus())).count();

                Map<String, Object> overview = new HashMap<>();
                overview.put("totalHorses", horses.size());
                overview.put("eligibleHorses", eligibleHorses);
                overview.put("lockedHorses", lockedHorses);
                overview.put("totalStalls", stables.size());
                overview.put("occupiedStalls", occupiedStalls);
                overview.put("availableStalls", availableStalls);
                overview.put("totalUsers", users.size());
                overview.put("activeIncidents", activeIncidents);
                overview.put("totalPrizePool", "3.500.000.000 VNĐ");

                out.print(gson.toJson(overview));
                out.flush();
                return;
            }

            List<User> list = userDAO.getAllUsers();
            out.print(gson.toJson(list));
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải dữ liệu quản trị.");
        }
    }

    /**
     * POST /api/users: Thêm nhân viên / người dùng mới (Chỉ MANAGER)
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User admin = SecurityUtil.requireRole(request, response, "MANAGER");
        if (admin == null) {
            return;
        }

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu JSON không hợp lệ.");
                return;
            }

            String username = SecurityUtil.getString(body, "username", "").trim();
            String fullName = SecurityUtil.getString(body, "full_name", "").trim();
            if (fullName.isEmpty()) {
                fullName = SecurityUtil.getString(body, "fullName", "").trim();
            }

            if (username.isEmpty() || fullName.isEmpty()) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Vui lòng nhập tên đăng nhập và họ tên đầy đủ.");
                return;
            }

            String email = SecurityUtil.getString(body, "email", username + "@matruong.vn").trim().toLowerCase();
            String phone = SecurityUtil.getString(body, "phone", "").trim();
            String roleCode = SecurityUtil.getString(body, "role", "TRAINER").trim().toUpperCase();
            String password = SecurityUtil.getString(body, "password", "123456").trim();

            if (SecurityUtil.containsMaliciousPayload(username)
                    || SecurityUtil.containsMaliciousPayload(fullName)
                    || SecurityUtil.containsMaliciousPayload(email)
                    || SecurityUtil.containsMaliciousPayload(phone)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thông tin người dùng chứa ký tự không hợp lệ.");
                return;
            }

            User newUser = userDAO.register(username, password, fullName, email, phone, roleCode);
            if (newUser != null) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(newUser));
                    out.flush();
                }
            } else {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_CONFLICT,
                    "Không thể tạo người dùng mới. Tên đăng nhập hoặc Email đã tồn tại.");
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi tạo người dùng.");
        }
    }

    /**
     * PUT /api/users hoặc PUT /api/users/{id}: Cập nhật thông tin nhân sự
     */
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User admin = SecurityUtil.requireRole(request, response, "MANAGER");
        if (admin == null) {
            return;
        }

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu yêu cầu không hợp lệ.");
                return;
            }

            int userId = -1;
            String pathInfo = request.getPathInfo();
            if (pathInfo != null && pathInfo.length() > 1) {
                try {
                    userId = Integer.parseInt(pathInfo.substring(1).trim());
                } catch (NumberFormatException e) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "ID người dùng trên URL không hợp lệ.");
                    return;
                }
            } else {
                userId = SecurityUtil.getInt(body, "userId",
                    SecurityUtil.getInt(body, "user_id",
                        SecurityUtil.getInt(body, "id", -1)));
            }

            if (userId <= 0) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thiếu ID người dùng cần cập nhật.");
                return;
            }

            String fullName = SecurityUtil.getString(body, "full_name",
                SecurityUtil.getString(body, "fullName", ""));
            String email = SecurityUtil.getString(body, "email", "");
            String phone = SecurityUtil.getString(body, "phone", "");
            String roleCode = SecurityUtil.getString(body, "role",
                SecurityUtil.getString(body, "roleCode", ""));
            String status = SecurityUtil.getString(body, "status", "ACTIVE");

            if (userId == 1 && "INACTIVE".equalsIgnoreCase(status)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                    "Không thể vô hiệu hóa tài khoản Quản trị viên gốc.");
                return;
            }

            if (SecurityUtil.containsMaliciousPayload(fullName)
                    || SecurityUtil.containsMaliciousPayload(email)
                    || SecurityUtil.containsMaliciousPayload(phone)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu cập nhật chứa ký tự không hợp lệ.");
                return;
            }

            boolean success = userDAO.updateUser(userId, fullName, email, phone, roleCode, status);
            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "Cập nhật người dùng thành công.");
                result.put("userId", userId);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(result));
                    out.flush();
                }
            } else {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                    "Không tìm thấy người dùng cần cập nhật.");
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi cập nhật người dùng.");
        }
    }

    /**
     * DELETE /api/users/{id}: Vô hiệu hóa hoặc xóa người dùng
     */
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User admin = SecurityUtil.requireRole(request, response, "MANAGER");
        if (admin == null) {
            return;
        }

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                "Vui lòng truyền ID người dùng trong URL (/api/users/{id}).");
            return;
        }

        int userId;
        try {
            userId = Integer.parseInt(pathInfo.substring(1).trim());
        } catch (NumberFormatException e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                "ID người dùng không hợp lệ.");
            return;
        }

        if (userId <= 1 || userId == admin.getUserId()) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                "Không được phép xóa tài khoản Quản trị viên gốc hoặc tài khoản đang đăng nhập.");
            return;
        }

        boolean success = userDAO.deleteUser(userId);
        if (success) {
            response.setStatus(HttpServletResponse.SC_OK);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Đã vô hiệu hóa tài khoản thành công.");
            result.put("userId", userId);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(result));
                out.flush();
            }
        } else {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                "Không tìm thấy tài khoản để xóa.");
        }
    }
}
