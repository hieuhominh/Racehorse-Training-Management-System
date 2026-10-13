package controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import dal.MedicalLockDAO;
import model.MedicalLock;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API: Khóa/Mở khóa huấn luyện Y tế (Medical Lock API)
 * Dành riêng cho Bác sĩ Thú y (Veterinarian) để bảo đảm quyền phủ quyết y tế (Medical Safety Veto)
 * 
 * Endpoints:
 * - GET  /api/medical-locks              : Lấy danh sách toàn bộ lịch sử khóa y tế (hoặc lọc ?horseId=14)
 * - GET  /api/medical-locks/active?horseId=14 : Lấy trạng thái khóa đang hoạt động của ngựa
 * - POST /api/medical-locks              : BẬT LỆNH KHÓA HUẤN LUYỆN (Lock Training)
 *        Body JSON: { "horseId": 10, "veterinarianId": 3, "medicalRecordId": 4, "lockReason": "Viêm gân cổ chân" }
 * - PUT  /api/medical-locks/unlock       : GỠ BỎ KHÓA HUẤN LUYỆN (Unlock Training)
 *        Body JSON: { "horseId": 10, "releasedByVetId": 3, "releaseNotes": "Hồi phục tốt, kiểm tra bước chạy ổn định", "healthStatus": "Eligible" }
 */
@WebServlet(name = "MedicalLockApiController", urlPatterns = {"/api/medical-locks", "/api/medical-locks/*"})
public class MedicalLockApiController extends HttpServlet {

    private final MedicalLockDAO lockDAO = new MedicalLockDAO();
    private final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd HH:mm:ss")
            .serializeNulls()
            .setPrettyPrinting()
            .create();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        String horseIdParam = request.getParameter("horseId");

        try (PrintWriter out = response.getWriter()) {
            // Case 1: Lấy khóa đang active của ngựa
            if (pathInfo != null && pathInfo.contains("/active")) {
                if (horseIdParam == null) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\": false, \"message\": \"Vui lòng truyền mã ?horseId=...\"}");
                    return;
                }
                int horseId = Integer.parseInt(horseIdParam);
                MedicalLock activeLock = lockDAO.getActiveLockByHorseId(horseId);

                Map<String, Object> res = new HashMap<>();
                res.put("success", true);
                res.put("isLocked", activeLock != null);
                res.put("lockData", activeLock);
                out.print(gson.toJson(res));
                return;
            }

            // Case 2: Lấy danh sách theo horseId hoặc toàn bộ
            List<MedicalLock> list;
            if (horseIdParam != null && !horseIdParam.trim().isEmpty()) {
                int horseId = Integer.parseInt(horseIdParam);
                list = lockDAO.getLocksByHorseId(horseId);
            } else {
                list = lockDAO.getAllLocks();
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("total", list.size());
            res.put("data", list);
            out.print(gson.toJson(res));
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * POST: BẬT KHÓA HUẤN LUYỆN
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            JsonObject body = parseRequestBody(request);
            if (body == null || !body.has("horseId") || !body.has("lockReason")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Thiếu thông tin bắt buộc: horseId và lockReason.\"}");
                return;
            }

            int horseId = body.get("horseId").getAsInt();
            int vetId = body.has("veterinarianId") ? body.get("veterinarianId").getAsInt() : 3; // Mặc định vet_id = 3
            Integer recordId = body.has("medicalRecordId") && !body.get("medicalRecordId").isJsonNull()
                    ? body.get("medicalRecordId").getAsInt() : null;
            String reason = body.get("lockReason").getAsString();

            // Kiểm tra xem ngựa đã bị khóa chưa
            MedicalLock existingLock = lockDAO.getActiveLockByHorseId(horseId);
            if (existingLock != null) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("success", false);
                conflict.put("message", "Chiến mã này hiện đang bị khóa y tế trước đó. Không thể lặp lại lệnh khóa.");
                conflict.put("currentLock", existingLock);
                out.print(gson.toJson(conflict));
                return;
            }

            boolean success = lockDAO.lockHorse(horseId, vetId, recordId, reason);
            Map<String, Object> res = new HashMap<>();
            res.put("success", success);
            res.put("message", success ? "Đã kích hoạt LỆNH KHÓA HUẤN LUYỆN (Medical Lock) thành công! Hệ thống đã chặn xếp giáo án nặng." 
                                       : "Lỗi trong quá trình kích hoạt khóa y tế.");
            res.put("horseId", horseId);
            res.put("isMedicalLocked", true);
            out.print(gson.toJson(res));
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * PUT: GỠ BỎ KHÓA HUẤN LUYỆN (Unlock Training)
     */
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            JsonObject body = parseRequestBody(request);
            if (body == null || !body.has("horseId")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Thiếu thông tin horseId.\"}");
                return;
            }

            int horseId = body.get("horseId").getAsInt();
            int vetId = body.has("releasedByVetId") ? body.get("releasedByVetId").getAsInt() : 3;
            String notes = body.has("releaseNotes") ? body.get("releaseNotes").getAsString() : "Hồi phục đạt chuẩn kiểm tra thể lực";
            String newStatus = body.has("healthStatus") ? body.get("healthStatus").getAsString() : "Eligible";

            boolean success = lockDAO.unlockHorse(horseId, vetId, notes, newStatus);
            Map<String, Object> res = new HashMap<>();
            res.put("success", success);
            res.put("message", success ? "Đã GỠ BỎ KHÓA Y TẾ thành công! Ngựa đã sẵn sàng trở lại giáo án tập luyện." 
                                       : "Không tìm thấy khóa y tế đang hoạt động hoặc thao tác thất bại.");
            res.put("horseId", horseId);
            res.put("isMedicalLocked", false);
            res.put("newHealthStatus", newStatus);
            out.print(gson.toJson(res));
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }

    private JsonObject parseRequestBody(HttpServletRequest request) {
        try {
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            if (sb.length() == 0) return null;
            return JsonParser.parseString(sb.toString()).getAsJsonObject();
        } catch (Exception e) {
            return null;
        }
    }
}
