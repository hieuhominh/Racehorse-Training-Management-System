package controller;

import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
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
    "/api/vet/lock",
    "/api/vet/vaccines",
    "/api/vet/overview"
})
public class VetApiController extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/vet/medical-logs".equals(path)) {
                List<Map<String, Object>> logs = new ArrayList<>();

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
                logs.add(l1);

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
                logs.add(l2);

                out.print(gson.toJson(logs));
                return;
            }

            if ("/api/vet/vaccines".equals(path)) {
                List<Map<String, Object>> vaccines = new ArrayList<>();
                Map<String, Object> v1 = new HashMap<>();
                v1.put("id", 1);
                v1.put("horseName", "Xích Thố");
                v1.put("vaccineType", "Cúm ngựa (Equine Influenza) liều 2");
                v1.put("scheduledDate", "15/11/2026");
                v1.put("status", "SCHEDULED");
                vaccines.add(v1);

                out.print(gson.toJson(vaccines));
                return;
            }

            if ("/api/vet/overview".equals(path)) {
                Map<String, Object> overview = new HashMap<>();
                overview.put("totalHorses", 12);
                overview.put("eligibleCount", 10);
                overview.put("lockedCount", 1);
                overview.put("underTreatmentCount", 1);
                overview.put("emergencyColicAlerts", 0);
                out.print(gson.toJson(overview));
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            if ("/api/vet/medical-logs".equals(path)) {
                Map<String, Object> newLog = gson.fromJson(sb.toString(), Map.class);
                newLog.put("id", System.currentTimeMillis());
                response.setStatus(HttpServletResponse.SC_CREATED);
                out.print(gson.toJson(newLog));
                return;
            }

            if ("/api/vet/lock".equals(path)) {
                Map<String, Object> lockData = gson.fromJson(sb.toString(), Map.class);
                lockData.put("updatedAt", System.currentTimeMillis());
                out.print(gson.toJson(lockData));
            }
        }
    }
}
