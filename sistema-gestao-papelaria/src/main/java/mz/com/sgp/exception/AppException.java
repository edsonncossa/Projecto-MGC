package mz.com.sgp.exception;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(value = { "stackTrace", "suppressed", "cause", "localizedMessage", "message" })
public abstract class AppException extends RuntimeException {

	private static final long serialVersionUID = 7458422488439244886L;

	private String prettyMessage;

	private String rawMessage;

	public AppException(String message) {
		super(message);
		this.rawMessage = message;
	}

	public AppException(String pretty, String raw) {
		this.prettyMessage = pretty;
		this.rawMessage = raw;
	}

	public String getPrettyMessage() {
		return prettyMessage;
	}

	public String getRawMessage() {
		return rawMessage;
	}
}
