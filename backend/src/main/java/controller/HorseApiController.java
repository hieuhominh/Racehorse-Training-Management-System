package controller;

import com.google.gson.Gson;
import dal.HorseDAO;
import model.Horse;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * Servlet cung cấp REST API cho quản lý Ngựa đua
 * Endpoint: /api/horses
 */
@WebServlet(name = "HorseApiController", urlPatterns = {"/api/horses"})
public class HorseApiController extends HttpServlet {

    private final HorseDAO horseDAO = new HorseDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            List<Horse> horses = horseDAO.getAllHorses();
            String json = gson.toJson(horses);
            out.print(json);
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
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

            Horse horse = gson.fromJson(sb.toString(), Horse.class);
            if (horse == null || horse.getName() == null || horse.getMicrochipId() == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Vui lòng nhập tên ngựa và mã Chip RFID.\"}");
                return;
            }

            Horse created = horseDAO.addHorse(horse);
            if (created != null) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                out.print(gson.toJson(created));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\": \"Không thể lưu chiến mã mới vào cơ sở dữ liệu.\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
