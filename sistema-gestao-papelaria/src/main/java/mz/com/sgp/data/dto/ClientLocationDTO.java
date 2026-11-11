package mz.com.sgp.data.dto;

public record ClientLocationDTO(
        Long id,
        String firstName,
        String address,
        Double latitude,
        Double longitude) {
}