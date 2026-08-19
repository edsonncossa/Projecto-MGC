package mz.com.sgp.model;

import jakarta.persistence.Column;

import java.math.BigDecimal;
import java.util.Objects;

public class ServiceItemEntity {

    @Column(name = "NAME", nullable = false)
    private  String name;

    @Column(name = "DESCRIPTION", nullable = false)
    private String description;

    @Column(name = "UNIT_PRICE", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "UNIT", nullable = false)
    private String unit;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        ServiceItemEntity that = (ServiceItemEntity) o;
        return Objects.equals(name, that.name) && Objects.equals(description, that.description) && Objects.equals(unitPrice, that.unitPrice) && Objects.equals(unit, that.unit);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, description, unitPrice, unit);
    }
}
