package controller;

import com.google.gson.Gson;
import dal.IncidentDAO;
import model.Incident;

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
 * Servlet API Báo cáo sự cố chuồng trại
 * Endpoint: /api/incidents
 */
@WebServlet(name = "IncidentApiController", urlPatterns = {"/api/incidents"})
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

            Incident inc = gson.fromJson(sb.toString(), Incident.class);
            if (inc == null || inc.getStallCode() == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Dữ liệu sự cố không hợp lệ.\"}");
                return;
            }

            Incident created = incidentDAO.addIncident(inc);
            response.setStatus(HttpServletResponse.SC_CREATED);
            out.print(gson.toJson(created));
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
