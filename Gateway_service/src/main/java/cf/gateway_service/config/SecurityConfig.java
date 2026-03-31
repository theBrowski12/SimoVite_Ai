package cf.gateway_service.config;

import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
                .cors(Customizer.withDefaults())
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/actuator/**").permitAll()
                        .pathMatchers("/v1/catalog/**").permitAll()
                        .pathMatchers("/v1/orders/**").hasAnyRole("CLIENT", "ADMIN")
                        .pathMatchers("/v1/deliveries/pending").hasRole("COURIER")
                        .pathMatchers("/v1/deliveries/*/accept").hasRole("COURIER")
                        .pathMatchers("/v1/deliveries/courier/location").hasRole("COURIER")
                        .pathMatchers("/v1/deliveries/*/complete").hasRole("COURIER")
                        .pathMatchers("/v1/deliveries/all").hasRole("ADMIN")
                        .pathMatchers("/v1/admin/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.GET, "/CATALOG-SERVICE/v1/catalog/**", "/CATALOG-SERVICE/v1/catalog").permitAll()
                        .pathMatchers(HttpMethod.GET, "/CATALOG-SERVICE/v1/stores/**", "/CATALOG-SERVICE/v1/stores").permitAll()
                        .pathMatchers(HttpMethod.GET, "/CATALOG-SERVICE/v1/reviews/**", "/CATALOG-SERVICE/v1/reviews").permitAll()
                        .pathMatchers("/SIMOVITEAI_CHATBOT/v1/chat").permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );
        return http.build();
    }

    // ✅ Version réactive pour WebFlux
    @Bean
    public ReactiveJwtAuthenticationConverter jwtAuthenticationConverter() {
        ReactiveJwtAuthenticationConverter converter = new ReactiveJwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return converter;
    }
}
