package cf.notification_service.controllers;

import cf.notification_service.dto.EmailConfigDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/admin")
// @PreAuthorize("hasRole('ADMIN')") // Décommente si tu utilises Keycloak pour sécuriser cette route
public class AdminController {

    // Spring va automatiquement injecter les valeurs de application.properties ici
    @Value("${spring.mail.host}")
    private String mailHost;

    @Value("${spring.mail.port}")
    private String mailPort;

    @Value("${spring.mail.username}")
    private String mailSender;

    // ... (garde ta méthode getKafkaTopics() ici si elle y est) ...

    @GetMapping("/email-config")
    public EmailConfigDto getEmailConfig() {
        // On retourne la configuration (SANS LE MOT DE PASSE !)
        return new EmailConfigDto(mailHost, mailPort, mailSender);
    }
}
