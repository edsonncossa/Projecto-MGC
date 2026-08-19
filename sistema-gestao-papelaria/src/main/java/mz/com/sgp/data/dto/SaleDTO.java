package mz.com.sgp.data.dto;

import java.math.BigDecimal;
import java.util.Objects;

import org.springframework.hateoas.server.core.Relation;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import mz.com.sgp.config.audit.dto.AuditableDTO;
import mz.com.sgp.model.SaleStatus;

@Relation(collectionRelation = "sales", itemRelation = "sale")
public class SaleDTO extends AuditableDTO<SaleDTO> {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private ClientDTO client;

	private Long clientId;

	private BigDecimal totalValue;

	@Enumerated(EnumType.STRING)
	private SaleStatus saleStatus;

	public ClientDTO getClient() {
		return client;
	}

	public void setClient(ClientDTO client) {
		this.client = client;
	}

	public Long getClientId() {
		return clientId;
	}

	public void setClientId(Long clientId) {
		this.clientId = clientId;
	}

	public BigDecimal getTotalValue() {
		return totalValue;
	}

	public void setTotalValue(BigDecimal totalValue) {
		this.totalValue = totalValue;
	}

	public SaleStatus getSaleStatus() {
		return saleStatus;
	}

	public void setSaleStatus(SaleStatus saleStatus) {
		this.saleStatus = saleStatus;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + Objects.hash(client, clientId, saleStatus, totalValue);
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
		SaleDTO other = (SaleDTO) obj;
		return Objects.equals(client, other.client) && Objects.equals(clientId, other.clientId)
				&& saleStatus == other.saleStatus && Objects.equals(totalValue, other.totalValue);
	}

}
