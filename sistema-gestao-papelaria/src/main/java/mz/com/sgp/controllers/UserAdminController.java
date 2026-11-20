package mz.com.sgp.controllers;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.data.dto.UserAdminDTO;
import mz.com.sgp.data.dto.UserCreateRequest;
import mz.com.sgp.data.dto.UserUpdateRequest;
import mz.com.sgp.services.UserAdminService;

@Tag(name = "User Administration")
@RestController
@RequestMapping("/auth/users")
@PreAuthorize("hasAuthority('ADMIN_USERS')")
public class UserAdminController {

    private final UserAdminService service;

    public UserAdminController(UserAdminService service) {
        this.service = service;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<UserAdminDTO> list() {
        return service.list();
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public UserAdminDTO get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserAdminDTO> create(@RequestBody UserCreateRequest request) {
        UserAdminDTO created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.LOCATION, "/auth/users/" + created.id())
                .body(created);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public UserAdminDTO update(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        return service.update(id, request);
    }
}