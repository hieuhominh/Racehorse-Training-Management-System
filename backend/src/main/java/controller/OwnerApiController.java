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
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servlet API dành riêng cho Chủ sở hữu ngựa (Racehorse Owner Portal API)
 * Trang bị bảo vệ chống IDOR (Insecure Direct Object Reference):
 * Chủ sở hữu chỉ được xem/chỉnh sửa/xóa tài sản thuộc về chính mình.
 * Endpoints:
 * - GET, POST, PUT, DELETE /api/owner/horses, /api/owner/horses/*
 * - GET /api/owner/tournaments
 * - GET, POST, PUT /api/owner/races, /api/owner/races/*
 * - GET /api/owner/statements
 */
@WebServlet(name = "OwnerApiController", urlPatterns = {
    "/api/owner/horses",
    "/api/owner/horses/*",
    "/api/owner/tournaments",
    "/api/owner/races",
    "/api/owner/races/*",
    "/api/owner/statements",
    "/api/owner/telemetry",
    "/api/owner/vet-logs"
})
public class OwnerApiController extends HttpServlet {

    private static final Map<String, List<Map<String, Object>>> ownerHorsesStore = new ConcurrentHashMap<>();
    private static final Map<String, List<Map<String, Object>>> ownerRacesStore = new ConcurrentHashMap<>();

    private final Gson gson = new Gson();

    /**
     * Kiểm tra chống IDOR: Đảm bảo người dùng chỉ truy cập đúng dữ liệu của chính họ (trừ MANAGER)
     */
    private boolean isAuthorizedForOwnerKey(User authUser, String requestedOwnerKey) {
        if (authUser == null) return false;
        String role = authUser.getRoleCode() != null ? authUser.getRoleCode().toUpperCase() : "";
        if ("MANAGER".equals(role) || "ADMIN".equals(role) || "TRAINER".equals(role)) {
            return true;
        }
        if (requestedOwnerKey == null || requestedOwnerKey.trim().isEmpty()) {
            return true;
        }
        String key = requestedOwnerKey.trim();
        return key.equalsIgnoreCase(authUser.getUsername())
            || key.equalsIgnoreCase(String.valueOf(authUser.getUserId()))
            || (authUser.getEmail() != null && key.equalsIgnoreCase(authUser.getEmail()));
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            // Danh sách giải đấu mở đăng ký công khai
            if ("/api/owner/tournaments".equals(path)) {
                List<Map<String, Object>> tournaments = new ArrayList<>();

                Map<String, Object> t1 = new HashMap<>();
                t1.put("id", "TOURN-2026-01");
                t1.put("name", "Giải Vô Địch Cúp Derby Mùa Thu 2026 (Group 1)");
                t1.put("track", "Trường đua Quốc tế Phú Thọ");
                t1.put("surface", "Sân cỏ Tự nhiên (Turf)");
                t1.put("distance", "2.400m");
                t1.put("date", "15/11/2026");
                t1.put("totalPurse", 1500000000L);
                t1.put("entryFee", 10000000L);
                tournaments.add(t1);

                Map<String, Object> t2 = new HashMap<>();
                t2.put("id", "TOURN-2026-02");
                t2.put("name", "Cúp Nước Rút Tốc Độ Sprint Cup 2026 (Group 2)");
                t2.put("track", "Trường đua Cát Thể Thao");
                t2.put("surface", "Sân cát Nén (Dirt)");
                t2.put("distance", "1.200m");
                t2.put("date", "28/11/2026");
                t2.put("totalPurse", 800000000L);
                t2.put("entryFee", 5000000L);
                tournaments.add(t2);

                out.print(gson.toJson(tournaments));
                out.flush();
                return;
            }

            User authUser = SecurityUtil.requireRole(request, response, "OWNER", "MANAGER", "TRAINER");
            if (authUser == null) {
                return;
            }

            String ownerKey = request.getParameter("ownerKey");
            if (ownerKey != null && SecurityUtil.containsMaliciousPayload(ownerKey)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Tham số ownerKey không hợp lệ.");
                return;
            }

            if (!isAuthorizedForOwnerKey(authUser, ownerKey)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                    "Bạn không có quyền truy cập hồ sơ của chủ sở hữu khác (IDOR Protection).");
                return;
            }

            String resolvedKey = (ownerKey != null && !ownerKey.trim().isEmpty())
                ? ownerKey.trim().toLowerCase()
                : authUser.getUsername().toLowerCase();

            if ("/api/owner/statements".equals(path)) {
                List<Map<String, Object>> stmts = new ArrayList<>();
                Map<String, Object> s1 = new HashMap<>();
                s1.put("id", "STMT-2026-10");
                s1.put("period", "Tháng 10/2026");
                s1.put("horseName", "Bạch Long (100%)");
                s1.put("totalPrizeEarned", 350000000L);
                s1.put("boardingCost", 28000000L);
                s1.put("vetCost", 8000000L);
                s1.put("trainerCommission", 35000000L);
                s1.put("netPayable", 279000000L);
                s1.put("status", "PAID");
                stmts.add(s1);

                out.print(gson.toJson(stmts));
                out.flush();
                return;
            }

            if ("/api/owner/horses".equals(path)) {
                List<Map<String, Object>> horses = ownerHorsesStore.getOrDefault(resolvedKey, Collections.emptyList());
                out.print(gson.toJson(horses));
                out.flush();
                return;
            }

            if ("/api/owner/races".equals(path)) {
                List<Map<String, Object>> races = ownerRacesStore.getOrDefault(resolvedKey, Collections.emptyList());
                out.print(gson.toJson(races));
                out.flush();
                return;
            }

            out.print("[]");
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải dữ liệu chủ sở hữu.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "OWNER", "MANAGER");
        if (authUser == null) {
            return;
        }

        String path = request.getServletPath();

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu JSON không hợp lệ.");
                return;
            }

            String ownerKey = SecurityUtil.getString(body, "ownerKey", authUser.getUsername()).trim();
            if (!isAuthorizedForOwnerKey(authUser, ownerKey)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                    "Không được phép thao tác trên hồ sơ của chủ sở hữu khác.");
                return;
            }

            String resolvedKey = ownerKey.toLowerCase();

            if ("/api/owner/horses".equals(path)) {
                String name = SecurityUtil.getString(body, "name", "").trim();
                if (name.isEmpty() || SecurityUtil.containsMaliciousPayload(name)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Tên chiến mã đăng ký không hợp lệ.");
                    return;
                }

                int ownershipShare = SecurityUtil.getInt(body, "ownershipShare", 100);
                if (ownershipShare <= 0 || ownershipShare > 100) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Tỷ lệ cổ phần sở hữu phải nằm trong khoảng 1% - 100%.");
                    return;
                }

                Map<String, Object> newHorse = new HashMap<>();
                long id = System.currentTimeMillis();
                newHorse.put("id", id);
                newHorse.put("name", SecurityUtil.sanitize(name));
                newHorse.put("englishName", SecurityUtil.sanitize(SecurityUtil.getString(body, "englishName", name)));
                newHorse.put("breed", SecurityUtil.sanitize(SecurityUtil.getString(body, "breed", "Thoroughbred")));
                newHorse.put("microchip", SecurityUtil.sanitize(SecurityUtil.getString(body, "microchip", "MC-VN-2026")));
                newHorse.put("stable", SecurityUtil.sanitize(SecurityUtil.getString(body, "stable", "Ô A1")));
                newHorse.put("gender", SecurityUtil.sanitize(SecurityUtil.getString(body, "gender", "Ngựa đực (Stallion)")));
                newHorse.put("ownershipShare", ownershipShare);
                newHorse.put("trainer", SecurityUtil.sanitize(SecurityUtil.getString(body, "trainer", "Trần Văn Hùng (HLV Trưởng)")));
                newHorse.put("status", "ELIGIBLE");
                newHorse.put("statusText", "Đủ chuẩn thi đấu");
                newHorse.put("ownerKey", resolvedKey);

                List<Map<String, Object>> list = ownerHorsesStore.computeIfAbsent(
                    resolvedKey, k -> Collections.synchronizedList(new ArrayList<>())
                );
                list.add(0, newHorse);

                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(newHorse));
                    out.flush();
                }
                return;
            }

            if ("/api/owner/races".equals(path)) {
                String raceName = SecurityUtil.getString(body, "raceName", "").trim();
                String horseName = SecurityUtil.getString(body, "horseName", "").trim();
                if (raceName.isEmpty() || horseName.isEmpty()
                        || SecurityUtil.containsMaliciousPayload(raceName)
                        || SecurityUtil.containsMaliciousPayload(horseName)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Thông tin ghi danh giải đua không hợp lệ.");
                    return;
                }

                Map<String, Object> newNomination = new HashMap<>();
                newNomination.put("id", SecurityUtil.getString(body, "id", "RN-REG-" + (System.currentTimeMillis() % 10000)));
                newNomination.put("raceName", SecurityUtil.sanitize(raceName));
                newNomination.put("track", SecurityUtil.sanitize(SecurityUtil.getString(body, "track", "Trường đua Quốc tế Phú Thọ")));
                newNomination.put("horseName", SecurityUtil.sanitize(horseName));
                newNomination.put("ownerName", authUser.getFullName());
                newNomination.put("ownerKey", resolvedKey);
                newNomination.put("distance", SecurityUtil.sanitize(SecurityUtil.getString(body, "distance", "1.600m")));
                newNomination.put("date", SecurityUtil.sanitize(SecurityUtil.getString(body, "date", "15/11/2026")));
                newNomination.put("nominationStatus", "PENDING_TRAINER");
                newNomination.put("status", "PENDING");
                newNomination.put("jockey", SecurityUtil.sanitize(SecurityUtil.getString(body, "jockey", "Chưa chỉ định")));
                newNomination.put("notes", SecurityUtil.sanitize(SecurityUtil.getString(body, "notes", "")));

                List<Map<String, Object>> list = ownerRacesStore.computeIfAbsent(
                    resolvedKey, k -> Collections.synchronizedList(new ArrayList<>())
                );
                list.add(0, newNomination);

                // Đồng bộ sang danh sách chờ duyệt của Huấn luyện viên trưởng
                TrainingApiController.getSharedNominations().add(0, newNomination);

                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(newNomination));
                    out.flush();
                }
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi lưu dữ liệu chủ sở hữu.");
        }
    }

    /**
     * PUT /api/owner/horses/{id}: Cập nhật thông tin chiến mã thuộc quyền sở hữu
     */
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "OWNER", "MANAGER");
        if (authUser == null) {
            return;
        }

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu cập nhật không hợp lệ.");
                return;
            }

            String ownerKey = SecurityUtil.getString(body, "ownerKey", authUser.getUsername()).trim();
            if (!isAuthorizedForOwnerKey(authUser, ownerKey)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                    "Không được phép chỉnh sửa chiến mã của chủ sở hữu khác.");
                return;
            }

            String horseId = "";
            String pathInfo = request.getPathInfo();
            if (pathInfo != null && pathInfo.length() > 1) {
                horseId = pathInfo.substring(1).trim();
            } else {
                horseId = SecurityUtil.getString(body, "id", "").trim();
            }

            if (horseId.isEmpty() || SecurityUtil.containsMaliciousPayload(horseId)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thiếu ID chiến mã cần cập nhật.");
                return;
            }

            String name = SecurityUtil.getString(body, "name", "").trim();
            if (name.isEmpty() || SecurityUtil.containsMaliciousPayload(name)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Tên chiến mã không hợp lệ.");
                return;
            }

            int ownershipShare = SecurityUtil.getInt(body, "ownershipShare", 100);
            if (ownershipShare <= 0 || ownershipShare > 100) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Tỷ lệ sở hữu phải từ 1% đến 100%.");
                return;
            }

            Map<String, Object> updatedHorse = new HashMap<>();
            updatedHorse.put("id", horseId);
            updatedHorse.put("name", SecurityUtil.sanitize(name));
            updatedHorse.put("englishName", SecurityUtil.sanitize(SecurityUtil.getString(body, "englishName", name)));
            updatedHorse.put("breed", SecurityUtil.sanitize(SecurityUtil.getString(body, "breed", "Thoroughbred")));
            updatedHorse.put("gender", SecurityUtil.sanitize(SecurityUtil.getString(body, "gender", "Ngựa đực (Stallion)")));
            updatedHorse.put("microchip", SecurityUtil.sanitize(SecurityUtil.getString(body, "microchip", "")));
            updatedHorse.put("ownershipShare", ownershipShare);
            updatedHorse.put("trainer", SecurityUtil.sanitize(SecurityUtil.getString(body, "trainer", "")));
            updatedHorse.put("stable", SecurityUtil.sanitize(SecurityUtil.getString(body, "stable", "")));
            if (body.has("pedigree")) {
                updatedHorse.put("pedigree", gson.fromJson(body.get("pedigree"), Object.class));
            }
            updatedHorse.put("ownerKey", ownerKey.toLowerCase());
            updatedHorse.put("success", true);

            List<Map<String, Object>> list = ownerHorsesStore.computeIfAbsent(
                ownerKey.toLowerCase(), k -> Collections.synchronizedList(new ArrayList<>())
            );
            synchronized (list) {
                boolean found = false;
                for (int i = 0; i < list.size(); i++) {
                    if (horseId.equals(String.valueOf(list.get(i).get("id")))) {
                        list.set(i, updatedHorse);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    list.add(updatedHorse);
                }
            }

            response.setStatus(HttpServletResponse.SC_OK);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(updatedHorse));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi cập nhật chiến mã của chủ sở hữu.");
        }
    }

    /**
     * DELETE /api/owner/horses/{id}: Xóa chiến mã thuộc quyền sở hữu
     */
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "OWNER", "MANAGER");
        if (authUser == null) {
            return;
        }

        String ownerKey = request.getParameter("ownerKey");
        if (!isAuthorizedForOwnerKey(authUser, ownerKey)) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                "Bạn không có quyền xóa chiến mã của chủ sở hữu khác.");
            return;
        }

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                "Vui lòng truyền ID chiến mã cần xóa (/api/owner/horses/{id}).");
            return;
        }

        String horseId = pathInfo.substring(1).trim();
        if (horseId.isEmpty() || SecurityUtil.containsMaliciousPayload(horseId)) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                "ID chiến mã không hợp lệ.");
            return;
        }

        String resolvedKey = (ownerKey != null && !ownerKey.trim().isEmpty())
            ? ownerKey.trim().toLowerCase()
            : authUser.getUsername().toLowerCase();

        List<Map<String, Object>> list = ownerHorsesStore.get(resolvedKey);
        if (list != null) {
            synchronized (list) {
                list.removeIf(item -> horseId.equals(String.valueOf(item.get("id"))));
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("deletedId", horseId);
        result.put("message", "Đã xóa chiến mã khỏi danh mục sở hữu.");

        response.setStatus(HttpServletResponse.SC_OK);
        try (PrintWriter out = response.getWriter()) {
            out.print(gson.toJson(result));
            out.flush();
        }
    }
}
