package controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import dal.MedicalRecordDAO;
import model.HealthSchedule;
import model.MedicalRecord;

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
 * REST API: Danh sách Hồ sơ bệnh án & Tiêm phòng định kỳ
 * 
 * Endpoints:
 * 1. HỒ SƠ BỆNH ÁN (Medical Records):
 *    - GET /api/medical-records              : Danh sách toàn bộ bệnh án (kèm danh mục chấn thương 3D & toa thuốc kê đơn)
 *    - GET /api/medical-records?horseId=14   : Lọc bệnh án theo mã ngựa
 *    - GET /api/medical-records?id=6         : Chi tiết 1 bệnh án theo MedicalRecordID
 *    - GET /api/medical-records/6            : RESTful Chi tiết 1 bệnh án theo path variable
 * 
 * 2. LỊCH TIÊM PHÒNG & CHĂM SÓC ĐỊNH KỲ (Health Schedules):
 *    - GET /api/health-schedules             : Lấy toàn bộ lịch tiêm chủng, tẩy giun, gọt móng (Vaccination, Farrier, Deworming)
 *    - GET /api/health-schedules?id=1        : Chi tiết 1 lịch theo ID
 *    - GET /api/health-schedules/1           : RESTful Chi tiết 1 lịch theo path variable
 *    - GET /api/health-schedules?horseId=10  : Lọc lịch định kỳ theo cá thể ngựa
 *    - GET /api/health-schedules?type=Vaccination : Lọc theo loại (Vaccination, Farrier, Deworming)
 *    - GET /api/health-schedules?status=Pending   : Lọc theo trạng thái (Pending, Completed, Overdue)
 */
@WebServlet(name = "MedicalRecordApiController", urlPatterns = {
        "/api/medical-records", 
        "/api/medical-records/*", 
        "/api/health-schedules", 
        "/api/health-schedules/*"
})
public class MedicalRecordApiController extends HttpServlet {

    private final MedicalRecordDAO medicalRecordDAO = new MedicalRecordDAO();
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

        String servletPath = request.getServletPath();
        String pathInfo = request.getPathInfo();

        try (PrintWriter out = response.getWriter()) {
            // Xác định nhánh API dựa trên servletPath hoặc requestURI
            boolean isHealthSchedule = (servletPath != null && servletPath.contains("health-schedules"))
                    || (request.getRequestURI() != null && request.getRequestURI().contains("health-schedules"));

            if (isHealthSchedule) {
                handleHealthSchedules(request, response, out, pathInfo);
            } else {
                handleMedicalRecords(request, response, out, pathInfo);
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage() != null ? e.getMessage() : "Internal server error occurred");
            response.getWriter().print(gson.toJson(err));
        }
    }

    /**
     * Xử lý nhánh API LỊCH TIÊM CHỦNG & CHĂM SÓC ĐỊNH KỲ (/api/health-schedules)
     */
    private void handleHealthSchedules(HttpServletRequest request, HttpServletResponse response, 
                                       PrintWriter out, String pathInfo) {
        String idParam = request.getParameter("id");
        if ((idParam == null || idParam.trim().isEmpty()) && pathInfo != null && !pathInfo.isEmpty() && !pathInfo.equals("/")) {
            idParam = pathInfo.replaceAll("^/+", "").trim();
        }

        // Trường hợp tra cứu chi tiết 1 lịch tiêm/chăm sóc cụ thể
        if (idParam != null && !idParam.isEmpty()) {
            try {
                int scheduleId = Integer.parseInt(idParam);
                HealthSchedule schedule = medicalRecordDAO.getHealthScheduleById(scheduleId);
                if (schedule == null) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    Map<String, Object> notFound = new HashMap<>();
                    notFound.put("success", false);
                    notFound.put("message", "Không tìm thấy lịch tiêm chủng/chăm sóc với ID: " + scheduleId);
                    out.print(gson.toJson(notFound));
                } else {
                    Map<String, Object> res = new HashMap<>();
                    res.put("success", true);
                    res.put("data", schedule);
                    out.print(gson.toJson(res));
                }
                return;
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, Object> badReq = new HashMap<>();
                badReq.put("success", false);
                badReq.put("message", "Mã lịch định kỳ ID không hợp lệ.");
                out.print(gson.toJson(badReq));
                return;
            }
        }

        // Lấy danh sách lịch theo bộ lọc
        String horseIdParam = request.getParameter("horseId");
        String typeParam = request.getParameter("type");
        String statusParam = request.getParameter("status");

        Integer horseId = null;
        if (horseIdParam != null && !horseIdParam.trim().isEmpty()) {
            try {
                horseId = Integer.parseInt(horseIdParam);
            } catch (NumberFormatException ignored) {}
        }

        List<HealthSchedule> schedules = medicalRecordDAO.getHealthSchedules(horseId, typeParam, statusParam);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("total", schedules.size());

        Map<String, Object> filterMap = new HashMap<>();
        filterMap.put("horseId", horseId != null ? horseId : "ALL");
        filterMap.put("type", typeParam != null && !typeParam.trim().isEmpty() ? typeParam : "ALL");
        filterMap.put("status", statusParam != null && !statusParam.trim().isEmpty() ? statusParam : "ALL");
        res.put("filter", filterMap);

        res.put("data", schedules);
        out.print(gson.toJson(res));
        out.flush();
    }

    /**
     * Xử lý nhánh API HỒ SƠ BỆNH ÁN (/api/medical-records)
     */
    private void handleMedicalRecords(HttpServletRequest request, HttpServletResponse response, 
                                      PrintWriter out, String pathInfo) {
        String idParam = request.getParameter("id");
        if ((idParam == null || idParam.trim().isEmpty()) && pathInfo != null && !pathInfo.isEmpty() && !pathInfo.equals("/")) {
            idParam = pathInfo.replaceAll("^/+", "").trim();
        }

        // Trường hợp lấy chi tiết 1 hồ sơ bệnh án theo ID (hỗ trợ ?id=6 hoặc /api/medical-records/6)
        if (idParam != null && !idParam.isEmpty()) {
            try {
                int recordId = Integer.parseInt(idParam);
                MedicalRecord record = medicalRecordDAO.getMedicalRecordById(recordId);
                if (record == null) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    Map<String, Object> notFound = new HashMap<>();
                    notFound.put("success", false);
                    notFound.put("message", "Không tìm thấy hồ sơ bệnh án với ID: " + recordId);
                    out.print(gson.toJson(notFound));
                } else {
                    Map<String, Object> res = new HashMap<>();
                    res.put("success", true);
                    res.put("data", record);
                    out.print(gson.toJson(res));
                }
                return;
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, Object> badReq = new HashMap<>();
                badReq.put("success", false);
                badReq.put("message", "Mã record ID không hợp lệ.");
                out.print(gson.toJson(badReq));
                return;
            }
        }

        // Lấy danh sách hồ sơ bệnh án (có thể lọc theo mã ngựa ?horseId=...)
        String horseIdParam = request.getParameter("horseId");
        Integer horseId = null;
        if (horseIdParam != null && !horseIdParam.trim().isEmpty()) {
            try {
                horseId = Integer.parseInt(horseIdParam);
            } catch (NumberFormatException ignored) {}
        }

        List<MedicalRecord> records = medicalRecordDAO.getMedicalRecords(horseId);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("total", records.size());
        if (horseId != null) {
            res.put("filterHorseId", horseId);
        }
        res.put("data", records);
        out.print(gson.toJson(res));
        out.flush();
    }
}
