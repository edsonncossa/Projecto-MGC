package mz.com.sgp.security.jwt;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {

    private final PasswordEncoder encoder;

    public PasswordHasher() {
        Pbkdf2PasswordEncoder pbkdf2 = new Pbkdf2PasswordEncoder("", 8, 185000,
                Pbkdf2PasswordEncoder.SecretKeyFactoryAlgorithm.PBKDF2WithHmacSHA256);
        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("pbkdf2", pbkdf2);
        DelegatingPasswordEncoder delegating = new DelegatingPasswordEncoder("pbkdf2", encoders);
        delegating.setDefaultPasswordEncoderForMatches(pbkdf2);
        this.encoder = delegating;
    }

    public String encode(CharSequence raw) {
        return encoder.encode(raw);
    }

    public boolean matches(CharSequence raw, String encoded) {
        return encoder.matches(raw, encoded);
    }
}