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
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servlet API Quản lý Khiếu nại & Báo cáo Nhân sự (HLV, Bác sĩ thú y, Nhân viên chăm sóc)
 * Endpoints:
 * - GET    /api/reports, /api/reports?ownerKey=...
 * - POST   /api/reports
 * - PUT    /api/reports/{id}/review, /api/reports/{id}
 * - DELETE /api/reports/{id}
 */
@WebServlet(name = "ReportApiController", urlPatterns = {
    "/api/reports",
    "/api/reports/*",
    "/api/personnel-reports",
    "/api/personnel-reports/*"
})
public class ReportApiController extends HttpServlet {

    private static final List<Map<String, Object>> memoryReports = Collections.synchronizedList(new ArrayList<>());
    private final Gson gson = new Gson();

    static {
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String ownerKey = request.getParameter("ownerKey");
        String targetRole = request.getParameter("targetRole");
        String status = request.getParameter("status");

        try (PrintWriter out = response.getWriter()) {
            List<Map<String, Object>> result = new ArrayList<>();
            synchronized (memoryReports) {
                for (Map<String, Object> r : memoryReports) {
                    if (ownerKey != null && !ownerKey.trim().isEmpty() && !"ALL".equalsIgnoreCase(ownerKey)) {
                        String rOwner = String.valueOf(r.get("ownerKey"));
                        if (!ownerKey.equalsIgnoreCase(rOwner)) {
                            continue;
                        }
                    }
                    if (targetRole != null && !targetRole.trim().isEmpty() && !"ALL".equalsIgnoreCase(targetRole)) {
                        String rRole = String.valueOf(r.get("targetRole"));
                        if (!targetRole.equalsIgnoreCase(rRole)) {
                            continue;
                        }
                    }
                    if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                        String rStatus = String.valueOf(r.get("status"));
                        if (!status.equalsIgnoreCase(rStatus)) {
                            continue;
                        }
                    }
                    result.add(r);
                }
            }
            out.print(gson.toJson(result));
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải danh sách khiếu nại báo cáo.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        // Nếu là POST /api/reports/{id}/review
        if (pathInfo != null && pathInfo.contains("/review")) {
            handleReviewReport(request, response, pathInfo);
            return;
        }

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Dữ liệu JSON không hợp lệ.");
                return;
            }

            String title = SecurityUtil.getString(body, "title", "").trim();
            String content = SecurityUtil.getString(body, "content", "").trim();
            String targetRole = SecurityUtil.getString(body, "targetRole", "TRAINER").trim();
            String ownerName = SecurityUtil.getString(body, "ownerName", "Chủ sở hữu chiến mã").trim();
            String ownerKey = SecurityUtil.getString(body, "ownerKey", "owner").trim();

            if (title.isEmpty() || content.isEmpty()) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Tiêu đề và nội dung khiếu nại không được để trống.");
                return;
            }

            long id = System.currentTimeMillis();
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
            String nowStr = sdf.format(new Date());

            Map<String, Object> newReport = new HashMap<>();
            newReport.put("id", id);
            newReport.put("title", title);
            newReport.put("content", content);
            newReport.put("targetRole", targetRole);
            newReport.put("targetPersonnelId", SecurityUtil.getString(body, "targetPersonnelId", ""));
            newReport.put("targetName", SecurityUtil.getString(body, "targetName", "Nhân sự phụ trách"));
            newReport.put("targetTitle", SecurityUtil.getString(body, "targetTitle", "Cán bộ chuyên môn"));
            newReport.put("ownerName", ownerName);
            newReport.put("ownerKey", ownerKey);
            newReport.put("ownerPhone", SecurityUtil.getString(body, "ownerPhone", ""));
            newReport.put("horseId", SecurityUtil.getInt(body, "horseId", 0));
            newReport.put("horseName", SecurityUtil.getString(body, "horseName", "Chiến mã phụ trách"));
            newReport.put("stall", SecurityUtil.getString(body, "stall", "Khu chuồng trại"));
            newReport.put("category", SecurityUtil.getString(body, "category", "Phản ánh chất lượng dịch vụ"));
            newReport.put("severity", SecurityUtil.getString(body, "severity", "MEDIUM"));
            newReport.put("evidenceNote", SecurityUtil.getString(body, "evidenceNote", ""));
            newReport.put("status", "PENDING");
            newReport.put("createdAt", nowStr);
            newReport.put("adminNotes", "");
            newReport.put("adminAction", "");
            newReport.put("adminFeedback", "");
            newReport.put("resolvedBy", null);
            newReport.put("resolvedAt", null);

            synchronized (memoryReports) {
                memoryReports.add(0, newReport);
            }

            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(newReport));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi khi gửi báo cáo khiếu nại: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        handleReviewReport(request, response, pathInfo);
    }

    private void handleReviewReport(HttpServletRequest request, HttpServletResponse response, String pathInfo)
            throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        if (pathInfo == null || pathInfo.length() <= 1) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Thiếu ID báo cáo cần thẩm tra.");
            return;
        }

        // Tách ID từ path: /1730002001 hoặc /1730002001/review
        String cleanPath = pathInfo.replace("/review", "").replaceAll("^/+", "");
        long reportId;
        try {
            reportId = Long.parseLong(cleanPath);
        } catch (NumberFormatException e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "ID báo cáo không hợp lệ.");
            return;
        }

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Dữ liệu thẩm tra JSON không hợp lệ.");
                return;
            }

            String status = SecurityUtil.getString(body, "status", "INVESTIGATING");
            String adminNotes = SecurityUtil.getString(body, "adminNotes", "");
            String adminAction = SecurityUtil.getString(body, "adminAction", "");
            String adminFeedback = SecurityUtil.getString(body, "adminFeedback", "");
            String resolvedBy = SecurityUtil.getString(body, "resolvedBy", "admin");

            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
            String nowStr = sdf.format(new Date());

            Map<String, Object> target = null;
            synchronized (memoryReports) {
                for (Map<String, Object> r : memoryReports) {
                    Object idObj = r.get("id");
                    if (idObj != null && String.valueOf(idObj).equals(String.valueOf(reportId))) {
                        r.put("status", status);
                        if (!adminNotes.isEmpty()) r.put("adminNotes", adminNotes);
                        if (!adminAction.isEmpty()) r.put("adminAction", adminAction);
                        if (!adminFeedback.isEmpty()) r.put("adminFeedback", adminFeedback);
                        r.put("resolvedBy", resolvedBy);
                        if ("RESOLVED".equalsIgnoreCase(status) || "DISMISSED".equalsIgnoreCase(status)) {
                            r.put("resolvedAt", nowStr);
                        }
                        target = r;
                        break;
                    }
                }
            }

            if (target == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy báo cáo với ID: " + reportId);
                return;
            }

            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(target));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi khi lưu kết quả thẩm tra báo cáo: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.length() <= 1) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST, "Thiếu ID báo cáo cần xóa.");
            return;
        }

        String cleanId = pathInfo.replaceAll("^/+", "").replace("/review", "");
        boolean removed = false;
        synchronized (memoryReports) {
            removed = memoryReports.removeIf(r -> String.valueOf(r.get("id")).equals(cleanId));
        }

        if (removed) {
            SecurityUtil.sendJsonSuccess(response, "Đã xóa bản ghi khiếu nại thành công.", "id", cleanId);
        } else {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND, "Không tìm thấy báo cáo để xóa.");
        }
    }
}

