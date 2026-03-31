package cf.gateway_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

// HealthAggregatorController.java (dans Gateway_Service)
@RestController
@RequestMapping("/v1/admin/health")
@CrossOrigin(origins = {"http://localhost:4200", "http://front-app-service:4200"})
@PreAuthorize("hasRole('ADMIN')")
public class HealthAggregatorController {

    // Appelle chaque service via WebClient
    private final WebClient webClient;
    public HealthAggregatorController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    record ServiceHealth(String name, String port, String status) {}

    @GetMapping
    public Mono<List<ServiceHealth>> getAllHealth() {
        List<Map<String, String>> services = List.of(
                Map.of("name","Catalog_Service",   "port","8081","url","http://localhost:8081/actuator/health"),
                Map.of("name","ORDER-SERVICE",     "port","8082","url","http://localhost:8082/actuator/health"),
                Map.of("name","Delivery_Service",  "port","8083","url","http://localhost:8083/actuator/health"),
                Map.of("name","ML_Service",       "port","8085","url","http://localhost:8085/health"),
                Map.of("name","Notification_Service","port","8089","url","http://localhost:8089/actuator/health"),
                Map.of("name","SimoViteAI_ChatBot","port","8089","url","http://localhost:8084/actuator/health")
                );

        return Flux.fromIterable(services).flatMap(svc ->
                webClient.get().uri(svc.get("url"))
                        .retrieve().bodyToMono(JsonNode.class)
                        .map(json -> new ServiceHealth(
                                svc.get("name"),
                                svc.get("port"),
                                json.path("status").asText("DOWN").equals("UP") ? "UP" : "DOWN"
                        ))
                        .onErrorReturn(new ServiceHealth(svc.get("name"), svc.get("port"), "DOWN"))
        ).collectList();
    }
}
