package mz.com.sgp.exception.hadler;

import java.util.Date;

public record ExceptionResponse(Date timestamp, String message, String details) {
}
