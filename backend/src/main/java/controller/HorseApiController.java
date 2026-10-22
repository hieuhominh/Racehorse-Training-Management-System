package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.HorseDAO;
import model.Horse;

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
 * Servlet cung cấp REST API đầy đủ cho Quản lý Ngựa đua & Xem chi tiết
 * Endpoint: /api/horses, /api/horses/*
 */
@WebServlet(name = "HorseApiController", urlPatterns = {"/api/horses", "/api/horses/*"})
public class HorseApiController extends HttpServlet {

    private final HorseDAO horseDAO = new HorseDAO();
    private final Gson gson = new Gson();

    /**
     * GET /api/horses: Lấy toàn bộ danh sách ngựa
     * GET /api/horses/{id}: Lấy chi tiết hồ sơ 1 chiến mã
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        try (PrintWriter out = response.getWriter()) {
            // Nếu có ID trong URL (/api/horses/{id})
            if (pathInfo != null && pathInfo.length() > 1) {
                try {
                    int horseId = Integer.parseInt(pathInfo.substring(1));
                    Horse h = horseDAO.getHorseById(horseId);
                    if (h != null) {
                        out.print(gson.toJson(h));
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"Không tìm thấy chiến mã với ID " + horseId + "\"}");
                    }
                } catch (NumberFormatException e) {
                    // Tìm kiếm theo mã microchip
                    String chip = pathInfo.substring(1);
                    List<Horse> horses = horseDAO.getAllHorses();
                    Horse found = null;
                    for (Horse item : horses) {
                        if (chip.equalsIgnoreCase(item.getMicrochipId())) {
                            found = item;
                            break;
                        }
                    }
                    if (found != null) {
                        out.print(gson.toJson(found));
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"Không tìm thấy chiến mã với mã chip " + chip + "\"}");
                    }
                }
                out.flush();
                return;
            }

            // Lấy danh sách toàn bộ
            List<Horse> horses = horseDAO.getAllHorses();
            String json = gson.toJson(horses);
            out.print(json);
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * POST /api/horses: Tạo hồ sơ chiến mã mới
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

            Horse horse = gson.fromJson(sb.toString(), Horse.class);
            if (horse == null || horse.getName() == null || horse.getMicrochipId() == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Vui lòng nhập tên ngựa và mã Chip RFID.\"}");
                return;
            }

            Horse created = horseDAO.addHorse(horse);
            if (created != null) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                out.print(gson.toJson(created));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\": \"Không thể lưu chiến mã mới vào cơ sở dữ liệu.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * PUT /api/horses hoặc PUT /api/horses/{id}: Cập nhật thông tin hoặc Khóa/Mở khóa y tế
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

            int horseId = -1;
            String pathInfo = request.getPathInfo();
            if (pathInfo != null && pathInfo.length() > 1) {
                try {
                    horseId = Integer.parseInt(pathInfo.substring(1));
                } catch (Exception ignored) {}
            } else if (body.has("horseId")) {
                horseId = body.get("horseId").getAsInt();
            } else if (body.has("id")) {
                try {
                    horseId = body.get("id").getAsInt();
                } catch (Exception ignored) {}
            }

            if (horseId <= 0) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Thiếu ID chiến mã cần cập nhật.\"}");
                return;
            }

            // Nếu là thao tác toggle lock y tế
            if (body.has("toggleLock")) {
                boolean locked = body.get("toggleLock").getAsBoolean();
                boolean ok = horseDAO.toggleLock(horseId, locked);
                if (ok) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"message\": \"Cập nhật trạng thái khóa y tế thành công.\", \"locked\": " + locked + "}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"error\": \"Không tìm thấy chiến mã để khóa y tế.\"}");
                }
                out.flush();
                return;
            }

            // Cập nhật thông tin đầy đủ
            Horse h = horseDAO.getHorseById(horseId);
            if (h == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\": \"Không tìm thấy chiến mã với ID " + horseId + "\"}");
                return;
            }

            if (body.has("name")) h.setName(body.get("name").getAsString());
            if (body.has("breed")) h.setBreed(body.get("breed").getAsString());
            if (body.has("gender")) h.setGender(body.get("gender").getAsString());
            if (body.has("weightKg")) h.setWeightKg(body.get("weightKg").getAsDouble());
            if (body.has("sireName")) h.setSireName(body.get("sireName").getAsString());
            if (body.has("damName")) h.setDamName(body.get("damName").getAsString());
            if (body.has("healthStatus")) h.setHealthStatus(body.get("healthStatus").getAsString());
            if (body.has("isTrainingLocked")) h.setTrainingLocked(body.get("isTrainingLocked").getAsBoolean());

            boolean ok = horseDAO.updateHorse(h);
            if (ok) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print(gson.toJson(h));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\": \"Cập nhật thông tin chiến mã thất bại.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * DELETE /api/horses/{id}: Xóa hồ sơ chiến mã
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
                out.print("{\"error\": \"Vui lòng truyền ID chiến mã cần xóa (/api/horses/{id}).\"}");
                return;
            }

            int horseId = Integer.parseInt(pathInfo.substring(1));
            boolean ok = horseDAO.deleteHorse(horseId);
            if (ok) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Đã xóa hồ sơ chiến mã thành công.\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\": \"Không tìm thấy chiến mã để xóa.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
