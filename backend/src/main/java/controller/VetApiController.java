package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.HorseDAO;
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
 * Servlet API dành riêng cho Bác sĩ Thú Y (Veterinary Medical API)
 * Endpoints:
 * - /api/vet/medical-logs
 * - /api/vet/lock
 * - /api/vet/vaccines
 * - /api/vet/overview
 */
@WebServlet(name = "VetApiController", urlPatterns = {
    "/api/vet/medical-logs",
    "/api/vet/medical-logs/*",
    "/api/vet/lock",
    "/api/vet/vaccines",
    "/api/vet/vaccines/*",
    "/api/vet/overview"
})
public class VetApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryLogs = Collections.synchronizedList(new ArrayList<>());
    private static final List<Map<String, Object>> memoryVaccines = Collections.synchronizedList(new ArrayList<>());

    static {
        Map<String, Object> l1 = new HashMap<>();
        l1.put("id", 1);
        l1.put("horseName", "Phi Yến");
        l1.put("chipId", "MC-VN-2023-009");
        l1.put("issue", "Giãn gân trước trái cấp độ 2");
        l1.put("severity", "CRITICAL");
        l1.put("diagnosisBy", "Bác sĩ Nguyễn An (Trưởng khoa)");
        l1.put("medications", "Phenylbutazone 20% tiêm IV + Băng ép Cryo");
        l1.put("status", "UNDER_TREATMENT");
        l1.put("statusText", "Đang điều trị tích cực");
        l1.put("locked", true);
        l1.put("date", "09/10/2026");
        memoryLogs.add(l1);

        Map<String, Object> l2 = new HashMap<>();
        l2.put("id", 2);
        l2.put("horseName", "Bạch Long");
        l2.put("chipId", "MC-VN-2024-003");
        l2.put("issue", "Kiểm tra sinh hiệu định kỳ & Gọt móng");
        l2.put("severity", "NORMAL");
        l2.put("diagnosisBy", "Bác sĩ Nguyễn An");
        l2.put("medications", "Vaccine Cúm ngựa (Equine Influenza)");
        l2.put("status", "CLEARED");
        l2.put("statusText", "Khỏe mạnh xuất sắc");
        l2.put("locked", false);
        l2.put("date", "10/10/2026");
        memoryLogs.add(l2);

        Map<String, Object> v1 = new HashMap<>();
        v1.put("id", 1);
        v1.put("horseName", "Xích Thố");
        v1.put("vaccineType", "Cúm ngựa (Equine Influenza) liều 2");
        v1.put("scheduledDate", "15/11/2026");
        v1.put("status", "SCHEDULED");
        memoryVaccines.add(v1);
    }

    private final HorseDAO horseDAO = new HorseDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/vet/medical-logs".equals(path)) {
                synchronized (memoryLogs) {
                    out.print(gson.toJson(memoryLogs));
                }
                out.flush();
                return;
            }

            if ("/api/vet/vaccines".equals(path)) {
                synchronized (memoryVaccines) {
                    out.print(gson.toJson(memoryVaccines));
                }
                out.flush();
                return;
            }

            if ("/api/vet/overview".equals(path)) {
                Map<String, Object> overview = new HashMap<>();
                overview.put("totalHorses", 12);
                overview.put("totalChecked", 12);
                overview.put("eligibleCount", 10);
                overview.put("fitForRace", 10);
                overview.put("lockedCount", 1);
                overview.put("medicalLocked", 1);
                overview.put("underTreatmentCount", 1);
                overview.put("inRehab", 1);
                overview.put("emergencyColicAlerts", 0);
                overview.put("emergencyAlerts", 0);
                out.print(gson.toJson(overview));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải dữ liệu thú y.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "VET", "MANAGER");
        if (authUser == null) {
            return;
        }

        String path = request.getServletPath();

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu yêu cầu không hợp lệ.");
                return;
            }

            if ("/api/vet/medical-logs".equals(path)) {
                String horseName = SecurityUtil.getString(body, "horseName", "").trim();
                String issue = SecurityUtil.getString(body, "issue",
                    SecurityUtil.getString(body, "diagnosis", "")).trim();

                if (horseName.isEmpty() || issue.isEmpty()) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Vui lòng nhập tên chiến mã và chẩn đoán y tế.");
                    return;
                }

                if (SecurityUtil.containsMaliciousPayload(horseName) || SecurityUtil.containsMaliciousPayload(issue)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Nội dung bệnh án chứa ký tự không hợp lệ.");
                    return;
                }

                Map<String, Object> newLog = new HashMap<>();
                newLog.put("id", System.currentTimeMillis());
                newLog.put("horseName", SecurityUtil.sanitize(horseName));
                newLog.put("chipId", SecurityUtil.sanitize(SecurityUtil.getString(body, "chipId", "")));
                newLog.put("issue", SecurityUtil.sanitize(issue));
                newLog.put("severity", SecurityUtil.sanitize(SecurityUtil.getString(body, "severity", "NORMAL")));
                newLog.put("diagnosisBy", SecurityUtil.sanitize(SecurityUtil.getString(body, "diagnosisBy", authUser.getFullName())));
                newLog.put("medications", SecurityUtil.sanitize(SecurityUtil.getString(body, "medications", "")));
                newLog.put("status", SecurityUtil.sanitize(SecurityUtil.getString(body, "status", "UNDER_TREATMENT")));
                newLog.put("locked", SecurityUtil.getBoolean(body, "locked", false));
                newLog.put("date", SecurityUtil.getString(body, "date", "Hôm nay"));

                memoryLogs.add(0, newLog);
                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(newLog));
                    out.flush();
                }
                return;
            }

            if ("/api/vet/vaccines".equals(path)) {
                String horseName = SecurityUtil.getString(body, "horseName", "").trim();
                String vaccineType = SecurityUtil.getString(body, "vaccineType", "").trim();
                if (horseName.isEmpty() || vaccineType.isEmpty()
                        || SecurityUtil.containsMaliciousPayload(horseName)
                        || SecurityUtil.containsMaliciousPayload(vaccineType)) {
                    SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Thông tin tiêm chủng không hợp lệ.");
                    return;
                }

                Map<String, Object> v = new HashMap<>();
                v.put("id", System.currentTimeMillis());
                v.put("horseName", SecurityUtil.sanitize(horseName));
                v.put("vaccineType", SecurityUtil.sanitize(vaccineType));
                v.put("scheduledDate", SecurityUtil.sanitize(SecurityUtil.getString(body, "scheduledDate", "Hôm nay")));
                v.put("status", SecurityUtil.sanitize(SecurityUtil.getString(body, "status", "COMPLETED")));

                memoryVaccines.add(0, v);
                response.setStatus(HttpServletResponse.SC_CREATED);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(v));
                    out.flush();
                }
                return;
            }

            if ("/api/vet/lock".equals(path)) {
                int horseId = SecurityUtil.getInt(body, "horseId", SecurityUtil.getInt(body, "id", -1));
                boolean locked = SecurityUtil.getBoolean(body, "locked", true);
                if (horseId > 0) {
                    horseDAO.toggleLock(horseId, locked);
                }
                Map<String, Object> lockData = new HashMap<>();
                lockData.put("success", true);
                lockData.put("horseId", horseId);
                lockData.put("locked", locked);
                lockData.put("updatedBy", authUser.getFullName());
                lockData.put("updatedAt", System.currentTimeMillis());
                response.setStatus(HttpServletResponse.SC_OK);
                try (PrintWriter out = response.getWriter()) {
                    out.print(gson.toJson(lockData));
                    out.flush();
                }
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi xử lý nghiệp vụ thú y.");
        }
    }
}
