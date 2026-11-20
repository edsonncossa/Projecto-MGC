package mz.com.sgp.services;

import static mz.com.sgp.mapper.ObjectMapper.parseObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import mz.com.sgp.data.dto.UserDTO;
import mz.com.sgp.data.dto.security.AccountCredentialsDTO;
import mz.com.sgp.data.dto.security.ChangePasswordDTO;
import mz.com.sgp.data.dto.security.TokenDTO;
import mz.com.sgp.exception.RequiredObjectIsNullException;
import mz.com.sgp.model.UserEntity;
import mz.com.sgp.repository.UserRepository;
import mz.com.sgp.security.jwt.JwtTokenProvider;
import mz.com.sgp.security.jwt.PasswordHasher;

@Service
public class AuthService {

	Logger logger = LoggerFactory.getLogger(AuthService.class);

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtTokenProvider tokenProvider;

	@Autowired
	private UserRepository repository;

	@Autowired
	private PasswordHasher passwordHasher;

	public ResponseEntity<TokenDTO> signIn(AccountCredentialsDTO credentials) {
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(credentials.getUsername(), credentials.getPassword()));

		var user = repository.findByUsername(credentials.getUsername());
		if (user == null) {
			throw new UsernameNotFoundException("Username " + credentials.getUsername() + " not found!");
		}

		var userDTO = parseObject(user, UserDTO.class);
		userDTO.setPassword(null);
		var token = tokenProvider.createAccessToken(credentials.getUsername(), user.getRoles(), userDTO);
		return ResponseEntity.ok(token);
	}

	public ResponseEntity<TokenDTO> refreshToken(String username, String refreshToken) {
		var user = repository.findByUsername(username);
		TokenDTO token;
		if (user != null) {
			token = tokenProvider.refreshToken(refreshToken);
		} else {
			throw new UsernameNotFoundException("Username " + username + " not found!");
		}
		return ResponseEntity.ok(token);
	}

	@Transactional
	public void changePassword(ChangePasswordDTO dto) {
		if (dto == null || dto.getUsername() == null || dto.getOldPassword() == null || dto.getNewPassword() == null) {
			throw new RequiredObjectIsNullException("Dados inválidos para alterar a senha!");
		}

		var user = repository.findByUsername(dto.getUsername());
		if (user == null) {
			throw new UsernameNotFoundException("Usuário " + dto.getUsername() + " não encontrado!");
		}

		if (!passwordHasher.matches(dto.getOldPassword(), user.getPassword())) {
			throw new IllegalArgumentException("Senha antiga incorreta!");
		}

		user.setPassword(passwordHasher.encode(dto.getNewPassword()));
		repository.save(user);
	}

	@Transactional
	public UserDTO update(UserDTO user) {

		logger.info("Atualizando User!");
		UserEntity entity = repository.findByUsername(user.getUserName());
		if (entity == null) {
			throw new UsernameNotFoundException("Username " + user.getUserName() + " not found!");
		}

		entity.setImage(user.getImage());

		return parseObject(repository.save(entity), UserDTO.class);
	}
}