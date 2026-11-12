package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import dal.IncidentDAO;
import model.Incident;
import model.User;
import util.SecurityUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * Servlet API Báo cáo sự cố chuồng trại
 * Endpoint: /api/incidents, /api/incidents/*
 */
@WebServlet(name = "IncidentApiController", urlPatterns = {"/api/incidents", "/api/incidents/*"})
public class IncidentApiController extends HttpServlet {

    private final IncidentDAO incidentDAO = new IncidentDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            List<Incident> list = incidentDAO.getAllIncidents();
            out.print(gson.toJson(list));
            out.flush();
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Không thể tải danh sách sự cố.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "GROOM", "VET", "TRAINER", "MANAGER");
        if (authUser == null) {
            return;
        }

        try {
            JsonObject body = SecurityUtil.parseJsonObject(request);
            if (body == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Dữ liệu sự cố không hợp lệ.");
                return;
            }

            String stallCode = SecurityUtil.getString(body, "stallCode",
                SecurityUtil.getString(body, "stall_code", "")).trim();
            if (stallCode.isEmpty() || !SecurityUtil.isValidStallCode(stallCode)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Vui lòng nhập mã ô chuồng hợp lệ (stallCode).");
                return;
            }

            String symptoms = SecurityUtil.getString(body, "symptoms", "").trim();
            String description = SecurityUtil.getString(body, "description", "").trim();
            if (SecurityUtil.containsMaliciousPayload(symptoms) || SecurityUtil.containsMaliciousPayload(description)) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Nội dung báo cáo sự cố chứa ký tự không hợp lệ.");
                return;
            }

            Incident inc = new Incident(
                SecurityUtil.getString(body, "id", ""),
                stallCode.toUpperCase(),
                SecurityUtil.getString(body, "horseName", "Chưa xác định"),
                SecurityUtil.getString(body, "chipId", ""),
                symptoms,
                SecurityUtil.getString(body, "severity", "MEDIUM"),
                description,
                SecurityUtil.getString(body, "imageUrl", ""),
                SecurityUtil.getString(body, "reportedBy", authUser.getFullName()),
                SecurityUtil.getString(body, "timestamp", ""),
                SecurityUtil.getString(body, "status", "pending_vet")
            );

            Incident created = incidentDAO.addIncident(inc);
            response.setStatus(HttpServletResponse.SC_CREATED);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(created));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi lưu báo cáo sự cố.");
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User authUser = SecurityUtil.requireRole(request, response, "GROOM", "VET", "TRAINER", "MANAGER");
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

            String incidentId = "";
            String pathInfo = request.getPathInfo();
            if (pathInfo != null && pathInfo.length() > 1) {
                incidentId = pathInfo.substring(1).trim();
            } else {
                incidentId = SecurityUtil.getString(body, "id", "");
            }

            if (incidentId.isEmpty()) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Thiếu mã sự cố cần cập nhật.");
                return;
            }

            String status = SecurityUtil.getString(body, "status", "");
            String description = SecurityUtil.getString(body, "description", SecurityUtil.getString(body, "desc", ""));
            String symptoms = SecurityUtil.getString(body, "symptoms", "");
            String severity = SecurityUtil.getString(body, "severity", "");

            Incident updated = incidentDAO.updateIncident(incidentId, status, description, symptoms, severity);
            if (updated == null) {
                SecurityUtil.sendJsonError(response, HttpServletResponse.SC_NOT_FOUND,
                    "Không tìm thấy sự cố với mã: " + incidentId);
                return;
            }

            response.setStatus(HttpServletResponse.SC_OK);
            try (PrintWriter out = response.getWriter()) {
                out.print(gson.toJson(updated));
                out.flush();
            }
        } catch (Exception e) {
            SecurityUtil.sendJsonError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Lỗi máy chủ khi cập nhật sự cố.");
        }
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPut(req, resp);
        } else {
            super.service(req, resp);
        }
    }
}
