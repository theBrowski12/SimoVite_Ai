package cf.gateway_service.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import reactor.core.publisher.Flux;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@SuppressWarnings("unchecked")
public class KeycloakRoleConverter implements Converter<Jwt, Flux<GrantedAuthority>> {

    @Override
    public Flux<GrantedAuthority> convert(Jwt jwt) {
        Map<String, Object> realmAccess =
                (Map<String, Object>) jwt.getClaims().get("realm_access");

        if (realmAccess == null || realmAccess.isEmpty()) {
            return Flux.empty();
        }

        List<String> roles = (List<String>) realmAccess.get("roles");

        if (roles == null) {
            return Flux.empty();
        }

        return Flux.fromIterable(roles)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role));
    }
}
