package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.StableDAO;
import model.Stable;

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
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * POST /api/stables: Tạo ô chuồng mới
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
            if (body == null || !body.has("stall_code")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Vui lòng nhập mã ô chuồng (stall_code).\"}");
                return;
            }

            String stallCode = body.get("stall_code").getAsString().trim().toUpperCase();
            String block = body.has("block") ? body.get("block").getAsString() : "Block C";
            String status = body.has("status") ? body.get("status").getAsString() : "AVAILABLE";

            Stable newStall = new Stable(0, stallCode, block, status);
            boolean created = stableDAO.addStable(newStall);

            if (created) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                out.print(gson.toJson(newStall));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\": \"Không thể tạo ô chuồng mới. Mã chuồng có thể đã tồn tại.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * PUT /api/stables/reassign hoặc PUT /api/stables: Thay đổi chiến mã hoặc cập nhật ô chuồng
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
            if (body == null || !body.has("stall_code")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Thiếu mã ô chuồng (stall_code).\"}");
                return;
            }

            String stallCode = body.get("stall_code").getAsString();

            // Nếu là thao tác reassign chiến mã
            if (body.has("reassign")) {
                Integer horseId = null;
                if (body.has("horse_id") && !body.get("horse_id").isJsonNull()) {
                    try {
                        horseId = body.get("horse_id").getAsInt();
                    } catch (Exception ignored) {}
                }
                String horseName = body.has("horse") ? body.get("horse").getAsString() : "";
                String breed = body.has("breed") ? body.get("breed").getAsString() : "";

                boolean ok = stableDAO.reassignHorseToStall(stallCode, horseId, horseName, breed);
                if (ok) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"message\": \"Đã phân bổ lại chiến mã vào ô chuồng thành công.\", \"stall_code\": \"" + stallCode + "\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"error\": \"Cập nhật phân bổ ô chuồng thất bại.\"}");
                }
                out.flush();
                return;
            }

            // Cập nhật thông thường
            String block = body.has("block") ? body.get("block").getAsString() : "Block C";
            String status = body.has("status") ? body.get("status").getAsString() : "AVAILABLE";
            Stable s = new Stable(0, stallCode, block, status);
            boolean ok = stableDAO.updateStable(s);

            if (ok) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Cập nhật ô chuồng thành công.\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\": \"Không tìm thấy ô chuồng để cập nhật.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
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

        String pathInfo = request.getPathInfo();
        try (PrintWriter out = response.getWriter()) {
            if (pathInfo == null || pathInfo.equals("/")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Vui lòng truyền mã ô chuồng cần xóa trong URL (/api/stables/{stall_code}).\"}");
                return;
            }

            String stallCode = pathInfo.substring(1).trim().toUpperCase();
            boolean success = stableDAO.deleteStable(stallCode);

            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Đã xóa ô chuồng " + stallCode + " thành công.\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\": \"Không tìm thấy ô chuồng " + stallCode + " để xóa.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
