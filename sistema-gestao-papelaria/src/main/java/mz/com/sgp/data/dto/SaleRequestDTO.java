package mz.com.sgp.data.dto;

import java.util.List;

public class SaleRequestDTO {

	private SaleDTO sale;
	private List<SaleItemDTO> items;

	public SaleDTO getSale() {
		return sale;
	}

	public void setSale(SaleDTO sale) {
		this.sale = sale;
	}

	public List<SaleItemDTO> getItems() {
		return items;
	}

	public void setItems(List<SaleItemDTO> items) {
		this.items = items;
	}

}
