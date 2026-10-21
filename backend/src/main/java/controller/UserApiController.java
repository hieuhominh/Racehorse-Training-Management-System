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
 * Servlet API Quản lý Người dùng dành cho Admin
 * Endpoint: /api/users
 */
@WebServlet(name = "UserApiController", urlPatterns = {"/api/users/*"})
public class UserApiController extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();
    private final Gson gson = new Gson();

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
            if (body == null || !body.has("userId")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Thiếu ID người dùng cần cập nhật.\"}");
                return;
            }

            int userId = body.get("userId").getAsInt();
            String fullName = body.has("fullName") ? body.get("fullName").getAsString() : "";
            String email = body.has("email") ? body.get("email").getAsString() : "";
            String phone = body.has("phone") ? body.get("phone").getAsString() : "";
            String roleCode = body.has("roleCode") ? body.get("roleCode").getAsString() : "OWNER";
            String status = body.has("status") ? body.get("status").getAsString() : "ACTIVE";

            boolean success = userDAO.updateUser(userId, fullName, email, phone, roleCode, status);
            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Cập nhật người dùng thành công.\"}");
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
                out.print("{\"message\": \"Đã vô hiệu hóa tài khoản thành công.\"}");
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
