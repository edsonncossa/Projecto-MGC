package mz.com.sgp.model;

import jakarta.persistence.Column;

import java.util.Objects;

public class SaleProductItemEntity {

    @Column(name = "PRODUCT_ID", nullable = false)
   private ProductEntity product;

	@Column(name = "QUANTITY", nullable = false)
	private int quantity;

    public ProductEntity getProduct() {
        return product;
    }

    public void setProduct(ProductEntity product) {
        this.product = product;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        SaleProductItemEntity that = (SaleProductItemEntity) o;
        return quantity == that.quantity && Objects.equals(product, that.product);
    }

    @Override
    public int hashCode() {
        return Objects.hash(product, quantity);
    }
}
