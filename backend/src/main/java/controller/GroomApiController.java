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
 * Servlet API dành riêng cho Nhân viên Chăm sóc (Groom Portal API)
 * Endpoints:
 * - /api/groom/assignments
 * - /api/groom/feeding
 * - /api/groom/care-logs
 * - /api/groom/supplies
 */
@WebServlet(name = "GroomApiController", urlPatterns = {
    "/api/groom/assignments",
    "/api/groom/feeding",
    "/api/groom/care-logs",
    "/api/groom/supplies"
})
public class GroomApiController extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/groom/assignments".equals(path)) {
                List<Map<String, Object>> stalls = new ArrayList<>();

                Map<String, Object> s1 = new HashMap<>();
                s1.put("stallCode", "A1");
                s1.put("horseName", "Xích Thố");
                s1.put("block", "Block A");
                s1.put("beddingStatus", "CLEAN");
                s1.put("lastMucked", "06:30 - Sáng nay");
                stalls.add(s1);

                Map<String, Object> s2 = new HashMap<>();
                s2.put("stallCode", "A2");
                s2.put("horseName", "Bạch Long");
                s2.put("block", "Block A");
                s2.put("beddingStatus", "CLEAN");
                s2.put("lastMucked", "07:00 - Sáng nay");
                stalls.add(s2);

                out.print(gson.toJson(stalls));
                return;
            }

            if ("/api/groom/feeding".equals(path)) {
                List<Map<String, Object>> feeding = new ArrayList<>();
                Map<String, Object> f1 = new HashMap<>();
                f1.put("id", 1);
                f1.put("meal", "Bữa Sáng (06:00)");
                f1.put("ration", "3.5kg Yến mạch + 5kg Cỏ Timothy + Điện giải");
                f1.put("status", "COMPLETED");
                feeding.add(f1);

                Map<String, Object> f2 = new HashMap<>();
                f2.put("id", 2);
                f2.put("meal", "Bữa Trưa (11:30)");
                f2.put("ration", "4kg Cỏ tươi Alfalfa + Men tiêu hóa");
                f2.put("status", "PENDING");
                feeding.add(f2);

                out.print(gson.toJson(feeding));
                return;
            }

            if ("/api/groom/supplies".equals(path)) {
                List<Map<String, Object>> supplies = new ArrayList<>();
                Map<String, Object> sp1 = new HashMap<>();
                sp1.put("name", "Rơm lót chuồng khử khuẩn");
                sp1.put("inStock", "45 bao");
                sp1.put("minAlert", "10 bao");
                supplies.add(sp1);

                out.print(gson.toJson(supplies));
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            Map<String, Object> body = gson.fromJson(sb.toString(), Map.class);
            body.put("success", true);
            body.put("recordedAt", System.currentTimeMillis());
            response.setStatus(HttpServletResponse.SC_CREATED);
            out.print(gson.toJson(body));
        }
    }
}
