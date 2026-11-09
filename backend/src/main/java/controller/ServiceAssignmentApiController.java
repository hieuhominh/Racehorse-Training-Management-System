package controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
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

/**
 * Servlet API quản lý chỉ định và xác nhận đội ngũ phục vụ (HLV, Bác sĩ, Groom)
 * Endpoints:
 * - GET  /api/service-assignments
 * - POST /api/service-assignments
 * - POST /api/service-assignments/confirm
 */
@WebServlet(name = "ServiceAssignmentApiController", urlPatterns = {
    "/api/service-assignments",
    "/api/service-assignments/confirm"
})
public class ServiceAssignmentApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryAssignments = Collections.synchronizedList(new ArrayList<>());
    private final Gson gson = new Gson();

    static {
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            synchronized (memoryAssignments) {
                out.print(gson.toJson(memoryAssignments));
            }
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể nạp danh sách chỉ định phục vụ.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu JSON không hợp lệ.");
                return;
            }

            if ("/api/service-assignments/confirm".equals(path)) {
                String horseId = SecurityUtil.getString(body, "horseId", "");
                String role = SecurityUtil.getString(body, "role", "").toLowerCase();
                String username = SecurityUtil.getString(body, "username", "");

                if (horseId.isEmpty() || role.isEmpty() || username.isEmpty()) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Thiếu thông tin xác nhận phục vụ.");
                    return;
                }

                boolean found = false;
                synchronized (memoryAssignments) {
                    for (Map<String, Object> item : memoryAssignments) {
                        String idStr = String.valueOf(item.get("id"));
                        String chip = (String) item.get("microchip");
                        String name = (String) item.get("horseName");

                        if (horseId.equals(idStr) || (chip != null && chip.equalsIgnoreCase(horseId)) || (name != null && name.equalsIgnoreCase(horseId))) {
                            String nowStr = "Hôm nay " + new java.text.SimpleDateFormat("HH:mm").format(new java.util.Date());
                            if ("trainer".equals(role)) {
                                item.put("trainerConfirmed", true);
                                item.put("trainerConfirmedAt", nowStr);
                            } else if ("vet".equals(role)) {
                                item.put("vetConfirmed", true);
                                item.put("vetConfirmedAt", nowStr);
                            } else if ("groom".equals(role)) {
                                item.put("groomConfirmed", true);
                                item.put("groomConfirmedAt", nowStr);
                            }
                            item.put("updatedAt", nowStr);
                            found = true;
                            break;
                        }
                    }
                }

                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Đã xác nhận phục vụ thành công!");
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(res));
                    out.flush();
                }
                return;
            }

            // POST /api/service-assignments: Lưu hoặc cập nhật đội ngũ phục vụ
            String horseName = SecurityUtil.getString(body, "horseName", "");
            String microchip = SecurityUtil.getString(body, "microchip", "");
            String horseId = SecurityUtil.getString(body, "id", "");

            if (horseName.isEmpty() && microchip.isEmpty() && horseId.isEmpty()) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thiếu thông tin nhận diện chiến mã.");
                return;
            }

            synchronized (memoryAssignments) {
                Map<String, Object> target = null;
                for (Map<String, Object> item : memoryAssignments) {
                    String idStr = String.valueOf(item.get("id"));
                    String chip = (String) item.get("microchip");
                    String name = (String) item.get("horseName");

                    if ((!horseId.isEmpty() && horseId.equals(idStr)) ||
                        (!microchip.isEmpty() && microchip.equalsIgnoreCase(chip)) ||
                        (!horseName.isEmpty() && horseName.equalsIgnoreCase(name))) {
                        target = item;
                        break;
                    }
                }

                if (target == null) {
                    target = new HashMap<>();
                    target.put("id", horseId.isEmpty() ? (memoryAssignments.size() + 1) : horseId);
                    memoryAssignments.add(target);
                }

                for (Map.Entry<String, JsonElement> entry : body.entrySet()) {
                    String k = entry.getKey();
                    JsonElement val = entry.getValue();
                    if (val.isJsonPrimitive()) {
                        if (val.getAsJsonPrimitive().isBoolean()) {
                            target.put(k, val.getAsBoolean());
                        } else if (val.getAsJsonPrimitive().isNumber()) {
                            target.put(k, val.getAsNumber());
                        } else {
                            target.put(k, val.getAsString());
                        }
                    }
                }
                target.put("updatedAt", "Vừa xong");
            }

            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.addProperty("message", "Đã lưu chỉ định phục vụ.");
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(res));
                out.flush();
            }

        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi xử lý yêu cầu chỉ định phục vụ.");
        }
    }
}

