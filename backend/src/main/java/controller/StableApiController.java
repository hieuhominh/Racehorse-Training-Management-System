package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.StableDAO;
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
 * Servlet API đầy đủ cho Quản lý Ô Chuồng (Stables & Stalls REST API)
 * Endpoint: /api/stables, /api/stables/*
 */
@WebServlet(name = "StableApiController", urlPatterns = {"/api/stables", "/api/stables/*"})
public class StableApiController extends HttpServlet {

    private final StableDAO stableDAO = new StableDAO();
    private final Gson gson = new Gson();

    /**
     * GET /api/stables: Lấy danh sách toàn bộ ô chuồng
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            List<Stable> stables = stableDAO.getAllStables();
            out.print(gson.toJson(stables));
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải danh sách ô chuồng.");
        }
    }

    /**
     * POST /api/stables: Tạo ô chuồng mới (Yêu cầu quyền MANAGER)
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "MANAGER");
        if (authUser == null) {
            return;
        }

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu JSON không hợp lệ.");
                return;
            }

            String stallCode = SecurityUtil.getString(body, "stall_code",
                SecurityUtil.getString(body, "stallCode", "")).trim().toUpperCase();

            if (!SecurityUtil.isValidStallCode(stallCode)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Mã ô chuồng (stall_code) không hợp lệ (chỉ chấp nhận chữ cái và số, tối đa 10 ký tự).");
                return;
            }

            String block = SecurityUtil.getString(body, "block",
                SecurityUtil.getString(body, "blockName", "Block C")).trim();
            String status = SecurityUtil.getString(body, "status", "AVAILABLE").trim().toUpperCase();

            if (SecurityUtil.containsMaliciousPayload(block) || SecurityUtil.containsMaliciousPayload(status)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thông tin ô chuồng chứa ký tự không hợp lệ.");
                return;
            }

            Stable newStall = new Stable(0, stallCode, block, status);
            boolean created = stableDAO.addStable(newStall);

            if (created) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(newStall));
                    out.flush();
                }
            } else {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_CONFLICT,
                    "Không thể tạo ô chuồng mới. Mã chuồng đã tồn tại.");
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi tạo ô chuồng.");
        }
    }

    /**
     * PUT /api/stables/{code} hoặc PUT /api/stables: Thay đổi chiến mã hoặc cập nhật ô chuồng
     */
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "MANAGER", "TRAINER", "GROOM");
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

            String stallCode = SecurityUtil.getString(body, "stall_code",
                SecurityUtil.getString(body, "stallCode", "")).trim().toUpperCase();

            String pathInfo = request.getPathInfo();
            if (stallCode.isEmpty() && pathInfo != null && pathInfo.length() > 1) {
                stallCode = pathInfo.substring(1).trim().toUpperCase();
            }

            if (!SecurityUtil.isValidStallCode(stallCode)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Mã ô chuồng (stall_code) không hợp lệ.");
                return;
            }

            if (body.has("reassign")) {
                int rawHorseId = SecurityUtil.getInt(body, "horse_id", -1);
                Integer horseId = rawHorseId > 0 ? rawHorseId : null;
                String horseName = SecurityUtil.getString(body, "horse", "").trim();
                String breed = SecurityUtil.getString(body, "breed", "").trim();

                if (SecurityUtil.containsMaliciousPayload(horseName) || SecurityUtil.containsMaliciousPayload(breed)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Thông tin chiến mã phân bổ không hợp lệ.");
                    return;
                }

                boolean ok = stableDAO.reassignHorseToStall(stallCode, horseId, horseName, breed);
                if (ok) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("message", "Đã phân bổ lại chiến mã vào ô chuồng thành công.");
                    result.put("stall_code", stallCode);
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(result));
                        out.flush();
                    }
                } else {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                        "Không tìm thấy ô chuồng để phân bổ chiến mã.");
                }
                return;
            }

            String block = SecurityUtil.getString(body, "block",
                SecurityUtil.getString(body, "blockName", "Block C")).trim();
            String status = SecurityUtil.getString(body, "status", "AVAILABLE").trim().toUpperCase();

            Stable s = new Stable(0, stallCode, block, status);
            boolean ok = stableDAO.updateStable(s);

            if (ok) {
                response.setStatus(HttpServletResponse.SC_OK);
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "Cập nhật ô chuồng thành công.");
                result.put("stall_code", stallCode);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(result));
                    out.flush();
                }
            } else {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                    "Không tìm thấy ô chuồng để cập nhật.");
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi cập nhật ô chuồng.");
        }
    }

    /**
     * DELETE /api/stables/{stall_code}: Xóa ô chuồng
     */
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "MANAGER");
        if (authUser == null) {
            return;
        }

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                "Vui lòng truyền mã ô chuồng cần xóa trong URL (/api/stables/{stall_code}).");
            return;
        }

        String stallCode = pathInfo.substring(1).trim().toUpperCase();
        if (!SecurityUtil.isValidStallCode(stallCode)) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                "Mã ô chuồng không hợp lệ.");
            return;
        }

        boolean success = stableDAO.deleteStable(stallCode);
        if (success) {
            response.setStatus(HttpServletResponse.SC_OK);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Đã xóa ô chuồng " + stallCode + " thành công.");
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(result));
                out.flush();
            }
        } else {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                "Không tìm thấy ô chuồng cần xóa.");
        }
    }
}
