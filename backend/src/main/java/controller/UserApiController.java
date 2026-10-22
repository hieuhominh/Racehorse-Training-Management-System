package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.UserDAO;
import model.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * Servlet API Quản lý Người dùng đầy đủ dành cho Admin (CRUD)
 * Endpoint: /api/users, /api/users/*
 */
@WebServlet(name = "UserApiController", urlPatterns = {"/api/users", "/api/users/*"})
public class UserApiController extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();
    private final Gson gson = new Gson();

    /**
     * GET /api/users: Lấy danh sách toàn bộ người dùng
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            List<User> list = userDAO.getAllUsers();
            out.print(gson.toJson(list));
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * POST /api/users: Thêm nhân viên / người dùng mới
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            JsonObject body = gson.fromJson(sb.toString(), JsonObject.class);
            if (body == null || !body.has("username") || !body.has("full_name")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Vui lòng nhập tên đăng nhập và họ tên đầy đủ.\"}");
                return;
            }

            String username = body.get("username").getAsString().trim();
            String fullName = body.get("full_name").getAsString().trim();
            String email = body.has("email") ? body.get("email").getAsString().trim() : username + "@matruong.vn";
            String phone = body.has("phone") ? body.get("phone").getAsString().trim() : "";
            String roleCode = body.has("role") ? body.get("role").getAsString().trim() : "TRAINER";
            String password = body.has("password") ? body.get("password").getAsString().trim() : "123";

            User newUser = userDAO.register(username, password, fullName, email, phone, roleCode);
            if (newUser != null) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                out.print(gson.toJson(newUser));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\": \"Không thể tạo người dùng mới. Tên đăng nhập hoặc Email có thể đã tồn tại.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
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

        try (PrintWriter out = response.getWriter()) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            JsonObject body = gson.fromJson(sb.toString(), JsonObject.class);
            if (body == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Dữ liệu yêu cầu không hợp lệ.\"}");
                return;
            }

            int userId = -1;
            String pathInfo = request.getPathInfo();
            if (pathInfo != null && pathInfo.length() > 1) {
                try {
                    userId = Integer.parseInt(pathInfo.substring(1));
                } catch (Exception ignored) {}
            } else if (body.has("userId")) {
                userId = body.get("userId").getAsInt();
            } else if (body.has("user_id")) {
                userId = body.get("user_id").getAsInt();
            } else if (body.has("id")) {
                userId = body.get("id").getAsInt();
            }

            if (userId <= 0) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Thiếu ID người dùng cần cập nhật.\"}");
                return;
            }

            String fullName = body.has("full_name") ? body.get("full_name").getAsString() : (body.has("fullName") ? body.get("fullName").getAsString() : "");
            String email = body.has("email") ? body.get("email").getAsString() : "";
            String phone = body.has("phone") ? body.get("phone").getAsString() : "";
            String roleCode = body.has("role") ? body.get("role").getAsString() : (body.has("roleCode") ? body.get("roleCode").getAsString() : "OWNER");
            String status = body.has("status") ? body.get("status").getAsString() : "ACTIVE";

            boolean success = userDAO.updateUser(userId, fullName, email, phone, roleCode, status);
            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Cập nhật người dùng thành công.\", \"userId\": " + userId + "}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\": \"Không tìm thấy người dùng hoặc cập nhật thất bại.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
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

        String pathInfo = request.getPathInfo();
        try (PrintWriter out = response.getWriter()) {
            if (pathInfo == null || pathInfo.equals("/")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Vui lòng truyền ID người dùng trong URL (/api/users/{id}).\"}");
                return;
            }

            int userId = Integer.parseInt(pathInfo.substring(1));
            boolean success = userDAO.deleteUser(userId);
            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Đã vô hiệu hóa tài khoản thành công.\", \"userId\": " + userId + "}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\": \"Không tìm thấy tài khoản để xóa.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
