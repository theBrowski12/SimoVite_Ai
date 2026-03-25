package cf.order_service.config;

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

            if (authentication instanceof JwtAuthenticationToken jwtAuth) {
                String token = jwtAuth.getToken().getTokenValue();
                System.out.println("✅ Feign Interceptor: Token trouvé et ajouté !");
                requestTemplate.header("Authorization", "Bearer " + token);
            }
            else {
                System.out.println("Feign Interceptor: AUTHENTICATION IS NULL OR WRONG TYPE");
            }
        };
    }
}
