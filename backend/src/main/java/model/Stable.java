package model;

import java.io.Serializable;

public class Stable implements Serializable {
    private int stableId;
    private String stallCode;
    private String blockName;
    private String status;

    public Stable() {
    }

    public Stable(int stableId, String stallCode, String blockName, String status) {
        this.stableId = stableId;
        this.stallCode = stallCode;
        this.blockName = blockName;
        this.status = status;
    }

    public int getStableId() { return stableId; }
    public void setStableId(int stableId) { this.stableId = stableId; }

    public String getStallCode() { return stallCode; }
    public void setStallCode(String stallCode) { this.stallCode = stallCode; }

    public String getBlockName() { return blockName; }
    public void setBlockName(String blockName) { this.blockName = blockName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
