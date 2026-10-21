package dal;

import model.Incident;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class IncidentDAO extends DBContext {
    private static final List<Incident> memoryIncidents = Collections.synchronizedList(new ArrayList<>());

    static {
        // Khởi tạo các sự cố mặc định ban đầu
        memoryIncidents.add(new Incident(
            "INC-9012", "A3", "Hắc Phong", "982-000-348-192-003",
            "Ngựa bỏ ăn, Có dấu hiệu đau bụng / Sốt", "HIGH",
            "Hắc Phong bỏ 2/3 khẩu phần cỏ Alfalfa buổi trưa, thở nhanh và dậm chân liên tục. Thân nhiệt 38.8°C, nghi ngờ đau bụng nhẹ (Colic).",
            "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80",
            "Groom Nguyễn Văn Hùng", "11:45 - 08/10/2026", "pending_vet"
        ));
        memoryIncidents.add(new Incident(
            "INC-8819", "B4", "Phi Vân", "982-000-348-192-010",
            "Móng bị xước / Rạn guốc", "MEDIUM",
            "Phát hiện vết rạn móng nhẹ ở guốc sau phải sau buổi tập trên sân cát. Đã làm sạch móng, ngâm đá & chờ Thú y kiểm tra.",
            "https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=600&q=80",
            "Groom Phạm Minh Tiến", "09:15 - 08/10/2026", "in_review"
        ));
    }

    public List<Incident> getAllIncidents() {
        return new ArrayList<>(memoryIncidents);
    }

    public Incident addIncident(Incident incident) {
        if (incident.getId() == null || incident.getId().isEmpty()) {
            incident.setId("INC-" + (System.currentTimeMillis() % 10000));
        }
        memoryIncidents.add(0, incident);
        return incident;
    }
}
