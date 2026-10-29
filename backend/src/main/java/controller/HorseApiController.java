package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.HorseDAO;
import model.Horse;
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
            if (pathInfo != null && pathInfo.length() > 1) {
                String param = pathInfo.substring(1).trim();
                if (SecurityUtil.containsMaliciousPayload(param)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Tham số truy vấn chiến mã không hợp lệ.");
                    return;
                }

                try {
                    int horseId = Integer.parseInt(param);
                    Horse h = horseDAO.getHorseById(horseId);
                    if (h != null) {
                        out.print(gson.toJson(h));
                    } else {
                        SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                            "Không tìm thấy chiến mã với ID " + horseId);
                    }
                } catch (NumberFormatException e) {
                    List<Horse> horses = horseDAO.getAllHorses();
                    Horse found = null;
                    for (Horse item : horses) {
                        if (param.equalsIgnoreCase(item.getMicrochipId()) || param.equalsIgnoreCase(item.getName())) {
                            found = item;
                            break;
                        }
                    }
                    if (found != null) {
                        out.print(gson.toJson(found));
                    } else {
                        SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                            "Không tìm thấy chiến mã với mã định danh yêu cầu.");
                    }
                }
                out.flush();
                return;
            }

            List<Horse> horses = horseDAO.getAllHorses();
            out.print(gson.toJson(horses));
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải danh sách chiến mã.");
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

        User authUser = SecurityUtil.requireRole(request, response, "MANAGER", "TRAINER", "OWNER");
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

            String name = SecurityUtil.getString(body, "name", "").trim();
            String microchipId = SecurityUtil.getString(body, "microchipId",
                SecurityUtil.getString(body, "microchip",
                    SecurityUtil.getString(body, "chipId", ""))).trim();

            if (name.isEmpty()) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Vui lòng nhập tên chiến mã.");
                return;
            }
            if (microchipId.isEmpty()) {
                microchipId = "MC-VN-2026-" + (System.currentTimeMillis() % 100000);
            }

            if (SecurityUtil.containsMaliciousPayload(name) || SecurityUtil.containsMaliciousPayload(microchipId)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thông tin chiến mã chứa ký tự không hợp lệ.");
                return;
            }

            double weightKg = SecurityUtil.getDouble(body, "weightKg", 485.0);
            if (weightKg <= 0 || weightKg > 1500) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Cân nặng chiến mã phải lớn hơn 0 và nhỏ hơn 1500 kg.");
                return;
            }

            Horse horse = new Horse();
            horse.setName(name);
            horse.setMicrochipId(microchipId);
            horse.setBreed(SecurityUtil.getString(body, "breed", "Thoroughbred"));
            horse.setGender(SecurityUtil.getString(body, "gender", "STALLION"));
            horse.setWeightKg(weightKg);
            horse.setSireName(SecurityUtil.getString(body, "sireName", SecurityUtil.getString(body, "sire", "Chưa cập nhật")));
            horse.setDamName(SecurityUtil.getString(body, "damName", SecurityUtil.getString(body, "dam", "Chưa cập nhật")));
            horse.setHealthStatus(SecurityUtil.getString(body, "healthStatus", "ELIGIBLE"));
            horse.setTrainingLocked(SecurityUtil.getBoolean(body, "isTrainingLocked", false));

            Horse created = horseDAO.addHorse(horse);
            if (created != null) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(created));
                    out.flush();
                }
            } else {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_CONFLICT,
                    "Không thể lưu chiến mã mới. Mã Chip RFID có thể đã tồn tại.");
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi tạo hồ sơ chiến mã.");
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

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu yêu cầu không hợp lệ.");
                return;
            }

            int horseId = -1;
            String pathInfo = request.getPathInfo();
            if (pathInfo != null && pathInfo.length() > 1) {
                String rawId = pathInfo.substring(1).trim();
                if (rawId.startsWith("H") || rawId.startsWith("h")) {
                    rawId = rawId.substring(1);
                }
                try {
                    horseId = Integer.parseInt(rawId);
                } catch (NumberFormatException e) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "ID chiến mã trên URL không hợp lệ.");
                    return;
                }
            } else {
                horseId = SecurityUtil.getInt(body, "horseId", SecurityUtil.getInt(body, "id", -1));
            }

            if (horseId <= 0) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thiếu ID chiến mã cần cập nhật.");
                return;
            }

            // Nếu là thao tác toggle lock y tế -> Chỉ Bác sĩ Thú y (VET) hoặc Quản lý (MANAGER) mới có quyền
            if (body.has("toggleLock")) {
                User vetOrManager = SecurityUtil.requireRole(request, response, "VET", "MANAGER");
                if (vetOrManager == null) {
                    return;
                }

                boolean locked = SecurityUtil.getBoolean(body, "toggleLock", false);
                boolean ok = horseDAO.toggleLock(horseId, locked);
                if (ok) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    Map<String, Object> resMap = new HashMap<>();
                    resMap.put("success", true);
                    resMap.put("message", "Cập nhật trạng thái khóa y tế thành công.");
                    resMap.put("locked", locked);
                    try (PrintWriter out = response.getWriter()) {
                        out.print(gson.toJson(resMap));
                        out.flush();
                    }
                } else {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                        "Không tìm thấy chiến mã để khóa y tế.");
                }
                return;
            }

            User authUser = SecurityUtil.requireRole(request, response, "MANAGER", "TRAINER", "VET", "OWNER");
            if (authUser == null) {
                return;
            }

            Horse h = horseDAO.getHorseById(horseId);
            if (h == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                    "Không tìm thấy chiến mã với ID " + horseId);
                return;
            }

            if (body.has("name")) {
                String newName = SecurityUtil.getString(body, "name", "").trim();
                if (newName.isEmpty() || SecurityUtil.containsMaliciousPayload(newName)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Tên chiến mã không hợp lệ.");
                    return;
                }
                h.setName(newName);
            }
            if (body.has("breed")) h.setBreed(SecurityUtil.getString(body, "breed", h.getBreed()));
            if (body.has("gender")) h.setGender(SecurityUtil.getString(body, "gender", h.getGender()));
            if (body.has("weightKg")) {
                double w = SecurityUtil.getDouble(body, "weightKg", h.getWeightKg());
                if (w <= 0 || w > 1500) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Cân nặng chiến mã không hợp lệ.");
                    return;
                }
                h.setWeightKg(w);
            }
            if (body.has("sireName")) h.setSireName(SecurityUtil.getString(body, "sireName", h.getSireName()));
            if (body.has("damName")) h.setDamName(SecurityUtil.getString(body, "damName", h.getDamName()));
            if (body.has("healthStatus")) h.setHealthStatus(SecurityUtil.getString(body, "healthStatus", h.getHealthStatus()));
            if (body.has("isTrainingLocked")) h.setTrainingLocked(SecurityUtil.getBoolean(body, "isTrainingLocked", h.isTrainingLocked()));

            boolean ok = horseDAO.updateHorse(h);
            if (ok) {
                response.setStatus(HttpServletResponse.SC_OK);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(h));
                    out.flush();
                }
            } else {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Cập nhật thông tin chiến mã thất bại.");
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi cập nhật hồ sơ chiến mã.");
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

        User authUser = SecurityUtil.requireRole(request, response, "MANAGER", "OWNER");
        if (authUser == null) {
            return;
        }

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                "Vui lòng truyền ID chiến mã cần xóa (/api/horses/{id}).");
            return;
        }

        String rawId = pathInfo.substring(1).trim();
        if (rawId.startsWith("H") || rawId.startsWith("h")) {
            rawId = rawId.substring(1);
        }

        int horseId;
        try {
            horseId = Integer.parseInt(rawId);
        } catch (NumberFormatException e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                "ID chiến mã không hợp lệ.");
            return;
        }

        boolean ok = horseDAO.deleteHorse(horseId);
        if (ok) {
            response.setStatus(HttpServletResponse.SC_OK);
            Map<String, Object> resMap = new HashMap<>();
            resMap.put("success", true);
            resMap.put("message", "Đã xóa hồ sơ chiến mã thành công.");
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(resMap));
                out.flush();
            }
        } else {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                "Không tìm thấy chiến mã để xóa.");
        }
    }
}
