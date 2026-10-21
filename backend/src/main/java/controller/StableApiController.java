package controller;

import com.google.gson.Gson;
import dal.StableDAO;
import model.Stable;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * Servlet API trả về danh sách chuồng trại
 * Endpoint: /api/stables
 */
@WebServlet(name = "StableApiController", urlPatterns = {"/api/stables"})
public class StableApiController extends HttpServlet {

    private final StableDAO stableDAO = new StableDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (PrintWriter out = response.getWriter()) {
            List<Stable> stables = stableDAO.getAllStables();
            String json = gson.toJson(stables);
            out.print(json);
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
