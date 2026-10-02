package controller;

import com.google.gson.Gson;
import dal.HorseDAO;
import model.Horse;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * Servlet cung cấp REST API cho ReactJS
 * Endpoint: http://localhost:8080/racehorse-backend/api/horses
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
}
