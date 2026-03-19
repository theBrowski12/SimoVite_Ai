package cf.catalog_service.utils; // ← adapter

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class JwtUtils {

    public static String getUserId() {
        return getJwt().getSubject(); // UUID Keycloak
    }

    public static String getEmail() {
        return getJwt().getClaimAsString("email");
    }

    public static String getFullName() {
        String first = getJwt().getClaimAsString("given_name");
        String last  = getJwt().getClaimAsString("family_name");
        return (first != null ? first : "") + " " + (last != null ? last : "");
    }

    private static Jwt getJwt() {
        return (Jwt) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
    }
}
