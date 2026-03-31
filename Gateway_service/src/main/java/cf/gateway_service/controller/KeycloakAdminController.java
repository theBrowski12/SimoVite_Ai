//package cf.gateway_service.controller;
//
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//// KeycloakAdminController.java
//@RestController
//@RequestMapping("/v1/admin/users") // ⚠️ Note bien ce chemin !
//@PreAuthorize("hasRole('ADMIN')")
//public class KeycloakAdminController {
//
//    @Value("${keycloak.realm}")
//    private String realm;
//
//    private final Keycloak keycloakAdmin; // bean injecté
//
//    public KeycloakAdminController(Keycloak keycloakAdmin) {
//        this.keycloakAdmin = keycloakAdmin;
//    }
//
//    @GetMapping("/clients")
//    public List<UserRepresentation> getClients() {
//        // Option beaucoup plus rapide : Demander à Keycloak de te donner
//        // directement les membres qui possèdent le rôle "CLIENT"
//        return keycloakAdmin
//                .realm(realm)
//                .roles()
//                .get("CLIENT")      // Cherche le rôle "CLIENT"
//                .getUserMembers();  // Récupère les utilisateurs liés à ce rôle
//    }
//}
