package mz.com.sgp.config.audit;

import java.util.Optional;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("auditorProvider")
public class AuditorAwareImpl implements AuditorAware<String>{

	  @Override
	    public Optional<String> getCurrentAuditor() {
	        // Retorna o utilizador logado, aqui só como exemplo "SYSTEM"
	        // Se tiveres autenticação, retorna o username do SecurityContext
		 
	        //return Optional.of("MESSI");
	        
	   //     Dica: se tiveres Spring Security, podes substituir "SYSTEM" por:
	         return Optional.of(SecurityContextHolder.getContext().getAuthentication().getName());
	    }
}
