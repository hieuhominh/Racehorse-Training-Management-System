package controller;

import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servlet API Giáo án huấn luyện & Chỉ số viễn trắc (Trainer)
 * Endpoint: /api/training/programs, /api/training/telemetry
 */
@WebServlet(name = "TrainingApiController", urlPatterns = {"/api/training/programs", "/api/training/telemetry"})
public class TrainingApiController extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/training/programs".equals(path)) {
                List<Map<String, Object>> programs = new ArrayList<>();
                
                Map<String, Object> p1 = new HashMap<>();
                p1.put("id", "PROG-01");
                p1.put("title", "Giáo án Tăng Tốc & Nước Rút 800m");
                p1.put("horse", "Xích Thố");
                p1.put("horseChip", "982-000-348-192-001");
                p1.put("phase", "Giai đoạn Siết Cân & Nước Rút");
                p1.put("surface", "Sân Cát (Sand)");
                p1.put("targetDistance", 800);
                p1.put("status", "ACTIVE");
                programs.add(p1);

                Map<String, Object> p2 = new HashMap<>();
                p2.put("id", "PROG-02");
                p2.put("title", "Giáo án Thể Lực & Sức Bền 2.400m");
                p2.put("horse", "Bạch Long");
                p2.put("horseChip", "982-000-348-192-002");
                p2.put("phase", "Xây Dựng Sức Bền Nền Tảng");
                p2.put("surface", "Sân Cỏ (Turf)");
                p2.put("targetDistance", 2400);
                p2.put("status", "ACTIVE");
                programs.add(p2);

                out.print(gson.toJson(programs));
                out.flush();
                return;
            }

            if ("/api/training/telemetry".equals(path)) {
                List<Map<String, Object>> telemetry = new ArrayList<>();
                
                Map<String, Object> t1 = new HashMap<>();
                t1.put("sessionTime", "06:15 - Hôm nay");
                t1.put("horse", "Hắc Phong");
                t1.put("heartRate", 188);
                t1.put("speed", 58.4);
                t1.put("distance", 1200);
                t1.put("alert", true);
                t1.put("status", "Chạy nước rút");
                telemetry.add(t1);

                out.print(gson.toJson(telemetry));
                out.flush();
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
