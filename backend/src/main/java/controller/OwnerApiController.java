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
 * Servlet API dành riêng cho Chủ sở hữu ngựa (Racehorse Owner Portal API)
 * Endpoints:
 * - /api/owner/horses
 * - /api/owner/tournaments
 * - /api/owner/races
 * - /api/owner/statements
 */
@WebServlet(name = "OwnerApiController", urlPatterns = {
    "/api/owner/horses",
    "/api/owner/tournaments",
    "/api/owner/races",
    "/api/owner/statements"
})
public class OwnerApiController extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/owner/tournaments".equals(path)) {
                List<Map<String, Object>> tournaments = new ArrayList<>();

                Map<String, Object> t1 = new HashMap<>();
                t1.put("id", "TOURN-2026-01");
                t1.put("name", "Giải Vô Địch Cúp Derby Mùa Thu 2026 (Group 1)");
                t1.put("track", "Trường đua Quốc tế Phú Thọ");
                t1.put("surface", "Sân cỏ Tự nhiên (Turf)");
                t1.put("distance", "2.400m");
                t1.put("date", "15/11/2026");
                t1.put("totalPurse", 1500000000L);
                t1.put("entryFee", 10000000L);
                tournaments.add(t1);

                Map<String, Object> t2 = new HashMap<>();
                t2.put("id", "TOURN-2026-02");
                t2.put("name", "Cúp Nước Rút Tốc Độ Sprint Cup 2026 (Group 2)");
                t2.put("track", "Trường đua Cát Thể Thao");
                t2.put("surface", "Sân cát Nén (Dirt)");
                t2.put("distance", "1.200m");
                t2.put("date", "28/11/2026");
                t2.put("totalPurse", 800000000L);
                t2.put("entryFee", 5000000L);
                tournaments.add(t2);

                out.print(gson.toJson(tournaments));
                return;
            }

            if ("/api/owner/statements".equals(path)) {
                List<Map<String, Object>> stmts = new ArrayList<>();
                Map<String, Object> s1 = new HashMap<>();
                s1.put("id", "STMT-2026-10");
                s1.put("period", "Tháng 10/2026");
                s1.put("horseName", "Bạch Long (100%)");
                s1.put("totalPrizeEarned", 350000000L);
                s1.put("boardingCost", 28000000L);
                s1.put("vetCost", 8000000L);
                s1.put("trainerCommission", 35000000L);
                s1.put("netPayable", 279000000L);
                s1.put("status", "PAID");
                stmts.add(s1);

                out.print(gson.toJson(stmts));
                return;
            }

            // Mặc định trả về dữ liệu rỗng cho owner chưa đăng ký
            out.print("[]");
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

            Map<String, Object> data = gson.fromJson(sb.toString(), Map.class);
            data.put("id", System.currentTimeMillis());
            data.put("success", true);
            response.setStatus(HttpServletResponse.SC_CREATED);
            out.print(gson.toJson(data));
        }
    }
}
