package mz.com.sgp.data.dto;

import java.util.Objects;

import org.springframework.hateoas.server.core.Relation;

import mz.com.sgp.config.audit.dto.AuditableDTO;
import mz.com.sgp.model.MovementType;

@Relation(collectionRelation = "StockMovement", itemRelation = "Movemen")
public class StockMovementDTO extends AuditableDTO<StockMovementDTO> {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private StockDTO stock;

	private Long stockId;

	private MovementType type;

	private Integer quantity;

	public StockDTO getStock() {
		return stock;
	}

	public void setStock(StockDTO stock) {
		this.stock = stock;
	}

	public Long getStockId() {
		return stockId;
	}

	public void setStockId(Long stockId) {
		this.stockId = stockId;
	}

	public MovementType getType() {
		return type;
	}

	public void setType(MovementType type) {
		this.type = type;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + Objects.hash(quantity, stock, stockId, type);
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
		StockMovementDTO other = (StockMovementDTO) obj;
		return Objects.equals(quantity, other.quantity) && Objects.equals(stock, other.stock)
				&& Objects.equals(stockId, other.stockId) && type == other.type;
	}

}
