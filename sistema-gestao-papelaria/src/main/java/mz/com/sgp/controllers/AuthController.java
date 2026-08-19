package mz.com.sgp.controllers;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.controllers.docs.AuthControllerDocs;
import mz.com.sgp.data.dto.UserDTO;
import mz.com.sgp.data.dto.security.AccountCredentialsDTO;
import mz.com.sgp.data.dto.security.ChangePasswordDTO;
import mz.com.sgp.services.AuthService;

@Tag(name = "Authentication Endpoint!")
@RestController
@RequestMapping("/auth")
public class AuthController implements AuthControllerDocs {

	@Autowired
	AuthService service;

	@PostMapping("/signin")
	@Override
	public ResponseEntity<?> signin(@RequestBody AccountCredentialsDTO credentials) {
		if (credentialsIsInvalid(credentials)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid client request!");
		}
		var token = service.signIn(credentials);

		if (token == null)
			ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid client request!");
		return ResponseEntity.ok().body(token);
	}

	@PutMapping("/refresh/{username}")
	@Override
	public ResponseEntity<?> refreshToken(@PathVariable("username") String username,
			@RequestHeader("Authorization") String refreshToken) {
		if (parametersAreInvalid(username, refreshToken))
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid client request!");
		var token = service.refreshToken(username, refreshToken);
		if (token == null)
			ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid client request!");
		return ResponseEntity.ok().body(token);
	}

	@PostMapping(value = "/createUser", consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE,
			MediaType.APPLICATION_YAML_VALUE }, produces = { MediaType.APPLICATION_JSON_VALUE,
					MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE })
	@Override
	public AccountCredentialsDTO create(@RequestBody AccountCredentialsDTO credentials) {
		return service.create(credentials);
	}

	@PutMapping(value = "/change-password", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> changePassword(@RequestBody ChangePasswordDTO password) {
		try {
			service.changePassword(password);
			return ResponseEntity.ok("Senha alterada com sucesso!");
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		} catch (UsernameNotFoundException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao alterar a senha");
		}
	}

	private boolean parametersAreInvalid(String username, String refreshToken) {
		return StringUtils.isBlank(username) || StringUtils.isBlank(refreshToken);
	}

	private static boolean credentialsIsInvalid(AccountCredentialsDTO credentials) {
		return credentials == null || StringUtils.isBlank(credentials.getPassword())
				|| StringUtils.isBlank(credentials.getUsername());
	}

	@PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public UserDTO update(@RequestBody UserDTO user) {
		return service.update(user);
	}
}
