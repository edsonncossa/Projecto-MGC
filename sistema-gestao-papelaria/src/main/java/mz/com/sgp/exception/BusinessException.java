package mz.com.sgp.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final HttpStatus status;

    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}