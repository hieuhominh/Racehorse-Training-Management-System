package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.UserDAO;
import model.User;
import util.SecurityUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Servlet API xử lý Đăng nhập, Đăng ký, Đăng xuất & Kiểm tra phiên
 * Endpoints: /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/me
 */
@WebServlet(name = "AuthApiController", urlPatterns = {
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/me"
})
public class AuthApiController extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User currentUser = SecurityUtil.requireAuth(request, response);
        if (currentUser == null) {
            return;
        }
        try (PrintWriter out = response.getWriter()) {
            out.print(gson.toJson(currentUser));
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try {
            // 1. Xử lý ĐĂNG XUẤT: /api/auth/logout
            if ("/api/auth/logout".equals(path)) {
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.invalidate();
                }
                try (PrintWriter out = response.getWriter()) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("message", "Đã đăng xuất thành công.");
                    out.print(gson.toJson(result));
                    out.flush();
                }
                return;
            }

            JsonObject jsonRequest = SecurityUtil.parseJsonObject(request);
            if (jsonRequest == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Dữ liệu JSON không hợp lệ.");
                return;
            }

            // 2. Xử lý ĐĂNG NHẬP: /api/auth/login
            if ("/api/auth/login".equals(path)) {
                String account = SecurityUtil.getString(jsonRequest, "account", "").trim();
                if (account.isEmpty()) {
                    account = SecurityUtil.getString(jsonRequest, "username", "").trim();
                }
                String password = SecurityUtil.getString(jsonRequest, "password", "");

                if (account.isEmpty() || password.isEmpty()) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Vui lòng nhập đầy đủ tài khoản/email và mật khẩu.");
                    return;
                }

                if (SecurityUtil.containsMaliciousPayload(account)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Tài khoản chứa ký tự không hợp lệ.");
                    return;
                }

                User user = userDAO.login(account, password);
                if (user != null) {
                    HttpSession session = request.getSession(true);
                    session.setAttribute("currentUser", user);
                    String token = SecurityUtil.generateToken(user);

                    Map<String, Object> payload = new HashMap<>();
                    payload.put("userId", user.getUserId());
                    payload.put("user_id", user.getUserId());
                    payload.put("username", user.getUsername());
                    payload.put("fullName", user.getFullName());
                    payload.put("full_name", user.getFullName());
                    payload.put("email", user.getEmail());
                    payload.put("phone", user.getPhone());
                    payload.put("roleId", user.getRoleId());
                    payload.put("roleCode", user.getRoleCode());
                    payload.put("role_code", user.getRoleCode());
                    payload.put("status", user.getStatus());
                    payload.put("token", token);

                    response.setStatus(HttpServletResponse.SC_OK);
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(payload));
                        out.flush();
                    }
                } else {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_UNAUTHORIZED,
                        "Tài khoản hoặc mật khẩu không chính xác.");
                }
                return;
            }

            // 3. Xử lý ĐĂNG KÝ: /api/auth/register
            if ("/api/auth/register".equals(path)) {
                String email = SecurityUtil.getString(jsonRequest, "email", "").trim().toLowerCase();
                String password = SecurityUtil.getString(jsonRequest, "password", "");
                String fullName = SecurityUtil.getString(jsonRequest, "fullName", "").trim();
                if (fullName.isEmpty()) {
                    fullName = SecurityUtil.getString(jsonRequest, "full_name", "").trim();
                }
                String phone = SecurityUtil.getString(jsonRequest, "phone", "").trim();
                String requestedRole = SecurityUtil.getString(jsonRequest, "role", "OWNER").trim().toUpperCase();
                String username = SecurityUtil.getString(jsonRequest, "username", "").trim();
                if (username.isEmpty() && email.contains("@")) {
                    username = email.split("@")[0];
                }
                if (fullName.isEmpty()) {
                    fullName = username;
                }

                if (email.isEmpty() || password.isEmpty()) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Vui lòng điền đầy đủ Email và Mật khẩu.");
                    return;
                }

                if (!SecurityUtil.isValidEmail(email)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Định dạng địa chỉ Email không hợp lệ.");
                    return;
                }

                if (password.length() < 6) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
                    return;
                }

                if (SecurityUtil.containsMaliciousPayload(username)
                        || SecurityUtil.containsMaliciousPayload(fullName)
                        || SecurityUtil.containsMaliciousPayload(email)
                        || SecurityUtil.containsMaliciousPayload(phone)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Dữ liệu đăng ký chứa ký tự không hợp lệ.");
                    return;
                }

                // Chống leo thang đặc quyền (Privilege Escalation): Không cho phép tự đăng ký quyền MANAGER / ADMIN
                if ("MANAGER".equals(requestedRole) || "ADMIN".equals(requestedRole)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                        "Không được phép tự đăng ký tài khoản Quản trị viên (MANAGER/ADMIN).");
                    return;
                }

                String safeRole = ("TRAINER".equals(requestedRole) || "VET".equals(requestedRole) || "GROOM".equals(requestedRole))
                    ? requestedRole
                    : "OWNER";

                User newUser = userDAO.register(username, password, fullName, email, phone, safeRole);
                if (newUser != null) {
                    HttpSession session = request.getSession(true);
                    session.setAttribute("currentUser", newUser);
                    String token = SecurityUtil.generateToken(newUser);

                    Map<String, Object> payload = new HashMap<>();
                    payload.put("userId", newUser.getUserId());
                    payload.put("user_id", newUser.getUserId());
                    payload.put("username", newUser.getUsername());
                    payload.put("fullName", newUser.getFullName());
                    payload.put("full_name", newUser.getFullName());
                    payload.put("email", newUser.getEmail());
                    payload.put("phone", newUser.getPhone());
                    payload.put("roleId", newUser.getRoleId());
                    payload.put("roleCode", newUser.getRoleCode());
                    payload.put("role_code", newUser.getRoleCode());
                    payload.put("status", newUser.getStatus());
                    payload.put("token", token);

                    response.setStatus(HttpServletResponse.SC_CREATED);
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(payload));
                        out.flush();
                    }
                } else {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_CONFLICT,
                        "Email hoặc Tên đăng nhập đã tồn tại trong hệ thống.");
                }
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi xử lý xác thực.");
        }
    }
}
