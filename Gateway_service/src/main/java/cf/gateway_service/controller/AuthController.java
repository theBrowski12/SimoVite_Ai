package cf.gateway_service.controller;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    @Value("${keycloak.realm:Simovite}")
    private String realm;

    private final Keycloak keycloakAdmin;

    @Autowired
    public AuthController(Keycloak keycloakAdmin) {
        this.keycloakAdmin = keycloakAdmin;
    }

    @PostMapping("/assign-role")
    public ResponseEntity<Void> assignRole(@AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) return ResponseEntity.badRequest().build();

        String userId = jwt.getSubject();

        // Keycloak exposes custom user attributes as claims
        String requestedRole = jwt.getClaimAsString("requested_role");

        if (requestedRole == null || requestedRole.isBlank()) {
            return ResponseEntity.ok().build();
        }

        RealmResource realmResource = keycloakAdmin.realm(realm);
        UserResource userResource = realmResource.users().get(userId);

        // Check user doesn't already have an app role assigned
        boolean alreadyHasRole = userResource.roles().realmLevel().listAll()
                .stream()
                .anyMatch(r -> List.of("CLIENT", "COURIER", "STORE_OWNER", "ADMIN")
                        .contains(r.getName().toUpperCase()));

        if (alreadyHasRole) {
            return ResponseEntity.ok().build();
        }

        RoleRepresentation role = realmResource.roles()
                .get(requestedRole.toUpperCase())
                .toRepresentation();

        userResource.roles().realmLevel().add(List.of(role));

        return ResponseEntity.ok().build();
    }
}
