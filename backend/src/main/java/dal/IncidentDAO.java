package dal;

import model.Incident;
import util.SecurityUtil;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class IncidentDAO extends DBContext {
    private static final List<Incident> memoryIncidents = Collections.synchronizedList(new ArrayList<>());

    static {
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
            "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80",
            "Groom Phạm Minh Tiến", "09:15 - 08/10/2026", "in_review"
        ));
    }

    public List<Incident> getAllIncidents() {
        synchronized (memoryIncidents) {
            return new ArrayList<>(memoryIncidents);
        }
    }

    public Incident addIncident(Incident incident) {
        if (incident == null) return null;
        if (incident.getId() == null || incident.getId().trim().isEmpty()) {
            incident.setId("INC-" + (System.currentTimeMillis() % 10000));
        } else {
            incident.setId(SecurityUtil.sanitize(incident.getId()));
        }
        incident.setStallCode(SecurityUtil.sanitize(incident.getStallCode()));
        incident.setHorseName(SecurityUtil.sanitize(incident.getHorseName()));
        incident.setSymptoms(SecurityUtil.sanitize(incident.getSymptoms()));
        incident.setDescription(SecurityUtil.sanitize(incident.getDescription()));
        incident.setReportedBy(SecurityUtil.sanitize(incident.getReportedBy()));
        if (incident.getStatus() == null || incident.getStatus().trim().isEmpty()) {
            incident.setStatus("pending_vet");
        }
        memoryIncidents.add(0, incident);
        return incident;
    }
}
