package filter;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Filter xử lý CORS an toàn và gắn các HTTP Security Headers chống XSS, Clickjacking, MIME-Sniffing
 */
@WebFilter(filterName = "CorsFilter", urlPatterns = {"/api/*"})
public class CorsFilter implements Filter {

    private static final Set<String> ALLOWED_ORIGINS = new HashSet<>(Arrays.asList(
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ));

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String origin = request.getHeader("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin.trim())) {
            response.setHeader("Access-Control-Allow-Origin", origin.trim());
            response.setHeader("Vary", "Origin");
            response.setHeader("Access-Control-Allow-Credentials", "true");
        } else if (origin == null) {
            response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        }

        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token, X-Requested-With");
        response.setHeader("Access-Control-Max-Age", "3600");

        // HTTP Security Headers chuẩn OWASP
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(servletRequest, servletResponse);
    }

    @Override
    public void destroy() {
    }
}
