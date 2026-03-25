package cf.catalog_service.configs;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@Configuration
public class FeignJwtInterceptor {

    @Bean
    public RequestInterceptor jwtRequestInterceptor() {
        return requestTemplate -> {

            Authentication authentication =
                    SecurityContextHolder.getContext().getAuthentication();

            // CAS 1: Utilisateur authentifié avec JWT
            if (authentication instanceof JwtAuthenticationToken jwtAuth) {
                String token = jwtAuth.getToken().getTokenValue();
                System.out.println("✅ Feign Interceptor: Token JWT utilisateur trouvé !");
                requestTemplate.header("Authorization", "Bearer " + token);
            }
            // CAS 2: Appel système (Kafka) - endpoint public, pas besoin de token
            else if (authentication != null && "system".equals(authentication.getPrincipal())) {
                System.out.println("🔧 Feign Interceptor: Appel système sans token (endpoint public)");
                // Ne pas ajouter de header Authorization
            }
            // CAS 3: Pas d'authentification
            else {
                System.out.println("⚠️ Feign Interceptor: Aucune authentification trouvée");
                System.out.println("   Type: " + (authentication != null ? authentication.getClass().getSimpleName() : "null"));
                // Tenter sans token car l'endpoint est public
            }
        };
    }
}
