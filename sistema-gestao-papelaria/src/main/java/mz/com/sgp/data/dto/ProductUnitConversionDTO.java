package mz.com.sgp.data.dto;

import java.util.Objects;

import org.springframework.hateoas.server.core.Relation;

import mz.com.sgp.config.audit.dto.AuditableDTO;

@Relation(collectionRelation = "productUnitConversion", itemRelation = "productUnitConversion")
public class ProductUnitConversionDTO extends AuditableDTO<ProductUnitConversionDTO> {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private ProductDTO product;

	private Long productId;

	private UnitDTO unit;

	private Long unitId;

	private Integer conversionFactor;

	public ProductDTO getProduct() {
		return product;
	}

	public void setProduct(ProductDTO product) {
		this.product = product;
	}

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public UnitDTO getUnit() {
		return unit;
	}

	public void setUnit(UnitDTO unit) {
		this.unit = unit;
	}

	public Long getUnitId() {
		return unitId;
	}

	public void setUnitId(Long unitId) {
		this.unitId = unitId;
	}

	public Integer getConversionFactor() {
		return conversionFactor;
	}

	public void setConversionFactor(Integer conversionFactor) {
		this.conversionFactor = conversionFactor;
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
		ProductUnitConversionDTO other = (ProductUnitConversionDTO) obj;
		return Objects.equals(conversionFactor, other.conversionFactor) && Objects.equals(product, other.product)
				&& Objects.equals(productId, other.productId) && Objects.equals(unit, other.unit)
				&& Objects.equals(unitId, other.unitId);
	}

}
