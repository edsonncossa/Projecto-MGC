package mz.com.sgp.model;

import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import mz.com.sgp.config.audit.entity.AuditableEntity;

@Entity
@Table(name = "STOCK_MOVEMENT")
public class StockMovementEntity extends AuditableEntity {

	/**
	 * 
	 */
	
	private static final long serialVersionUID = 1L;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "STOCK_ID", insertable = false, updatable = false, nullable = false)
	private StockEntity stock;

	@Column(name = "STOCK_ID", nullable = true)
	private Long stockId;

	@Enumerated(EnumType.STRING)
	@Column(name = "MOVEMENT_TYPE", nullable = false)
	private MovementType type;

	@Column(name = "QUANTITY", nullable = false)
	private Integer quantity;

	public StockEntity getStock() {
		return stock;
	}

	public void setStock(StockEntity stock) {
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
		StockMovementEntity other = (StockMovementEntity) obj;
		return Objects.equals(quantity, other.quantity) && Objects.equals(stock, other.stock)
				&& Objects.equals(stockId, other.stockId) && type == other.type;
	}

}
