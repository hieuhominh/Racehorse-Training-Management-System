package controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import dal.HorseDAO;
import model.Horse;

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
 * REST API: Quản lý Hồ sơ ngựa & Phả hệ 3 đời (Pedigree)
 * 
 * Endpoints:
 * - GET /api/horses                     : Lấy danh sách toàn bộ hồ sơ ngựa (hỗ trợ query ?chip=... hoặc ?status=...)
 * - GET /api/horses?id=10               : Lấy thông tin chi tiết một cá thể ngựa
 * - GET /api/horses?chip=985141001230003: Lấy thông tin ngựa theo mã microchip
 * - GET /api/horses/pedigree?id=10      : Lấy hồ sơ chi tiết kèm CÂY PHẢ HỆ 3 ĐỜI (G1, G2, G3: Sire, Dam, Grandparents)
 */
@WebServlet(name = "HorseApiController", urlPatterns = {"/api/horses", "/api/horses/*", "/api/horses/pedigree"})
public class HorseApiController extends HttpServlet {

    private final HorseDAO horseDAO = new HorseDAO();
    private final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd")
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

        String idParam = request.getParameter("id");
        String chipParam = request.getParameter("chip");

        // Parse ID from pathInfo if provided as /api/horses/10 or /api/horses/10/pedigree
        boolean isPedigreeRequest = servletPath.endsWith("/pedigree") || 
                (pathInfo != null && pathInfo.contains("/pedigree"));

        if (pathInfo != null && !pathInfo.isEmpty() && !pathInfo.equals("/")) {
            String cleanPath = pathInfo.replaceAll("^/", "");
            String[] segments = cleanPath.split("/");
            if (segments.length > 0 && !segments[0].equalsIgnoreCase("pedigree")) {
                idParam = segments[0];
            }
            if (segments.length > 1 && segments[1].equalsIgnoreCase("pedigree")) {
                isPedigreeRequest = true;
            }
        }

        try (PrintWriter out = response.getWriter()) {
            // Case 1: Yêu cầu cây phả hệ (Pedigree)
            if (isPedigreeRequest) {
                if (idParam == null || idParam.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    Map<String, Object> err = new HashMap<>();
                    err.put("success", false);
                    err.put("message", "Vui lòng cung cấp mã ID ngựa (?id=...) để tra cứu cây phả hệ 3 đời.");
                    out.print(gson.toJson(err));
                    return;
                }

                try {
                    int horseId = Integer.parseInt(idParam);
                    Horse pedigreeHorse = horseDAO.getHorsePedigree(horseId);
                    if (pedigreeHorse == null) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        Map<String, Object> notFound = new HashMap<>();
                        notFound.put("success", false);
                        notFound.put("message", "Không tìm thấy hồ sơ ngựa có ID: " + horseId);
                        out.print(gson.toJson(notFound));
                        return;
                    }

                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("data", pedigreeHorse);
                    out.print(gson.toJson(result));
                    return;
                } catch (NumberFormatException e) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\": false, \"message\": \"Mã ID ngựa không hợp lệ.\"}");
                    return;
                }
            }

            // Case 2: Tìm theo ID cụ thể
            if (idParam != null && !idParam.trim().isEmpty()) {
                try {
                    int horseId = Integer.parseInt(idParam);
                    Horse horse = horseDAO.getHorseById(horseId);
                    if (horse == null) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"success\": false, \"message\": \"Không tìm thấy ngựa.\"}");
                    } else {
                        Map<String, Object> result = new HashMap<>();
                        result.put("success", true);
                        result.put("data", horse);
                        out.print(gson.toJson(result));
                    }
                    return;
                } catch (NumberFormatException e) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\": false, \"message\": \"Mã ID không hợp lệ.\"}");
                    return;
                }
            }

            // Case 3: Tìm theo Microchip
            if (chipParam != null && !chipParam.trim().isEmpty()) {
                Horse horse = horseDAO.getHorseByMicrochip(chipParam.trim());
                if (horse == null) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"success\": false, \"message\": \"Không tìm thấy ngựa với mã microchip: " + chipParam + "\"}");
                } else {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("data", horse);
                    out.print(gson.toJson(result));
                }
                return;
            }

            // Case 4: Lấy danh sách toàn bộ hồ sơ
            List<Horse> horses = horseDAO.getAllHorses();
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("total", horses.size());
            responseData.put("data", horses);
            out.print(gson.toJson(responseData));
            out.flush();

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            response.getWriter().print(gson.toJson(err));
        }
    }
}
