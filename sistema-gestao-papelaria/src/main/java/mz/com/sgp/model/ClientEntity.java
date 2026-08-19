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
@Table(name = "CLIENT")
public class ClientEntity extends AuditableEntity {

	private static final long serialVersionUID = 1L;

	@Column(name = "FIRST_NAME", nullable = false)
	private String firstName;

	@Column(name = "PHONE_NUMBER", nullable = true)
	private String phoneNumber;

	@Column(name = "ADDRESS", nullable = true)
	private String address;

	@Column(name = "EMAIL", nullable = true)	
	private String email;

	@Column(name = "TYPE", nullable = true)
	@Enumerated(EnumType.STRING)
	ClientType type;

	public ClientEntity() {
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
		ClientEntity that = (ClientEntity) o;
		return  Objects.equals(firstName, that.firstName)
				 && Objects.equals(phoneNumber, that.phoneNumber)
				&& Objects.equals(address, that.address) && Objects.equals(email, that.email) && type == that.type;
	}

	@Override
	public int hashCode() {
		return Objects.hash(firstName, phoneNumber, address, email, type);
	}

}
