package mz.com.sgp.data.dto;

import java.util.Objects;

import org.springframework.hateoas.server.core.Relation;

import mz.com.sgp.config.audit.dto.AuditableDTO;
import mz.com.sgp.model.ClientType;

@Relation(collectionRelation = "clients", itemRelation = "client")
public class ClientDTO extends  AuditableDTO<ClientDTO> {

	private static final long serialVersionUID = 1L;

	private String firstName;

	private String phoneNumber;

	private String address;

	private String email;
	
	ClientType type;


	public ClientDTO() {
		super();
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public ClientType getType() {
		return type;
	}

	public void setType(ClientType type) {
		this.type = type;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || getClass() != o.getClass())
			return false;
		ClientDTO clientDTO = (ClientDTO) o;
		return Objects.equals(firstName, clientDTO.firstName)
				&& Objects.equals(phoneNumber, clientDTO.phoneNumber)
				&& Objects.equals(address, clientDTO.address) && Objects.equals(email, clientDTO.email)
				&& type == clientDTO.type;
	}

	@Override
	public int hashCode() {
		return Objects.hash(firstName, phoneNumber, address, email, type);
	}

}
