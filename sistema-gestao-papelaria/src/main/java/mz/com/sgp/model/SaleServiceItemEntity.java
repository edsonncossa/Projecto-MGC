package mz.com.sgp.model;

import java.util.Objects;

import jakarta.persistence.Column;

public class SaleServiceItemEntity {

    @Column(name = "SERVICE_ID", nullable = false)
    private ServiceItemEntity service;

    @Column(name = "SERVICE_ID", nullable = false)
    private ServiceItemEntity serviceId;

    @Column(name = "STOCK_QUANTITY", nullable = false)
    private int quantity;

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        SaleServiceItemEntity that = (SaleServiceItemEntity) o;
        return quantity == that.quantity && Objects.equals(service, that.service) && Objects.equals(serviceId, that.serviceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(service, serviceId, quantity);
    }
}
