package mz.com.sgp.exception;

public class ValidationException extends AppException{

	private static final long serialVersionUID = 7458422488439244886L;

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String pretty, String raw) {
        super(pretty, raw);
    }
}
