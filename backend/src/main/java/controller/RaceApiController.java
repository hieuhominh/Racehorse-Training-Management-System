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
 * Servlet API Giải đua & Đối soát tài chính (Owner / Achievements)
 * Endpoint: /api/races, /api/finance/settlements
 */
@WebServlet(name = "RaceApiController", urlPatterns = {"/api/races", "/api/finance/settlements"})
public class RaceApiController extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getServletPath();

        try (PrintWriter out = response.getWriter()) {
            if ("/api/races".equals(path)) {
                List<Map<String, Object>> races = new ArrayList<>();

                Map<String, Object> r1 = new HashMap<>();
                r1.put("id", "RACE-001");
                r1.put("raceName", "Cúp Đua Mã Mùa Thu Khai Mạc G1");
                r1.put("horseName", "Xích Thố");
                r1.put("date", "25/09/2026");
                r1.put("track", "Mặt sân cỏ Turf • 2.400 m");
                r1.put("rankBadge", "HẠNG NHẤT");
                r1.put("jockey", "Nài ngựa Nguyễn Văn Hùng");
                r1.put("timeRecord", "2:14.38");
                r1.put("prizeAmount", 600000000);
                r1.put("ownerShareAmount", 420000000);
                races.add(r1);

                Map<String, Object> r2 = new HashMap<>();
                r2.put("id", "RACE-002");
                r2.put("raceName", "Giải Vô Địch Nước Rút Mở Rộng");
                r2.put("horseName", "Xích Thố");
                r2.put("date", "18/08/2026");
                r2.put("track", "Mặt sân cát Sand • 1.400 m");
                r2.put("rankBadge", "HẠNG NHÌ");
                r2.put("jockey", "Nài ngựa Trần Quốc Bảo");
                r2.put("timeRecord", "1:21.05");
                r2.put("prizeAmount", 300000000);
                r2.put("ownerShareAmount", 210000000);
                races.add(r2);

                out.print(gson.toJson(races));
                out.flush();
                return;
            }

            if ("/api/finance/settlements".equals(path)) {
                List<Map<String, Object>> stmts = new ArrayList<>();

                Map<String, Object> s1 = new HashMap<>();
                s1.put("id", "STMT-2026-09");
                s1.put("period", "Tháng 09/2026");
                s1.put("horseName", "Xích Thố");
                s1.put("chipId", "982-000-348-192-001");
                s1.put("ownershipShare", 70);
                s1.put("shareRacePrize", 420000000);
                s1.put("shareMonthExpense", 36400000);
                s1.put("netPayout", 383600000);
                s1.put("status", "paid");
                s1.put("statusLabel", "Đã thanh toán đối soát");
                stmts.add(s1);

                out.print(gson.toJson(stmts));
                out.flush();
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
