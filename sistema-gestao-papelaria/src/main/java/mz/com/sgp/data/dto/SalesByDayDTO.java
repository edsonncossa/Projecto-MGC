package mz.com.sgp.data.dto;

public class SalesByDayDTO {

	String name;

	Integer value;

	public SalesByDayDTO(String name, Integer value) {
		super();
		this.name = name;
		this.value = value;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Integer getValue() {
		return value;
	}

	public void setValue(Integer value) {
		this.value = value;
	}

}
