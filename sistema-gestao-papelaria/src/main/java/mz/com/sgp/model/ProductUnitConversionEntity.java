package mz.com.sgp.model;

import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import mz.com.sgp.config.audit.entity.AuditableEntity;

@Entity
@Table(name = "PRODUCT_UNIT_CONVERSION")
public class ProductUnitConversionEntity extends AuditableEntity {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "PRODUCT_ID", insertable = false, updatable = false, nullable = false)
	private ProductEntity product;

	@Column(name = "PRODUCT_ID", nullable = false)
	private Long productId;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "UNIT_ID", insertable = false, updatable = false, nullable = false)
	private UnitEntity unit;

	@Column(name = "UNIT_ID", nullable = false)
	private Long unitId;

	private Integer conversionFactor;

	public ProductEntity getProduct() {
		return product;
	}

	public void setProduct(ProductEntity product) {
		this.product = product;
	}

	public UnitEntity getUnit() {
		return unit;
	}

	public void setUnit(UnitEntity unit) {
		this.unit = unit;
	}

	public Integer getConversionFactor() {
		return conversionFactor;
	}

	public void setConversionFactor(Integer conversionFactor) {
		this.conversionFactor = conversionFactor;
	}

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public Long getUnitId() {
		return unitId;
	}

	public void setUnitId(Long unitId) {
		this.unitId = unitId;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + Objects.hash(conversionFactor, product, productId, unit, unitId);
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!super.equals(obj))
			return false;
		if (getClass() != obj.getClass())
			return false;
		ProductUnitConversionEntity other = (ProductUnitConversionEntity) obj;
		return Objects.equals(conversionFactor, other.conversionFactor) && Objects.equals(product, other.product)
				&& Objects.equals(productId, other.productId) && Objects.equals(unit, other.unit)
				&& Objects.equals(unitId, other.unitId);
	}

}
