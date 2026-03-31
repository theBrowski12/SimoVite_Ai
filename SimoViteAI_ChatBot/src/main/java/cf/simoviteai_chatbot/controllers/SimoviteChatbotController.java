package cf.simoviteai_chatbot.controllers;

import cf.simoviteai_chatbot.agents.SimoviteAgent;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/v1")
public class SimoviteChatbotController {
    private final SimoviteAgent simoviteAgent;

    public SimoviteChatbotController(SimoviteAgent simoviteAgent) {
        this.simoviteAgent = simoviteAgent;
    }

    // 1. On crée un Record (DTO) pour mapper le JSON envoyé par Angular
    public record ChatRequest(String message, String sessionId) {}

    // 2. On change @GetMapping en @PostMapping
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody ChatRequest request) {

        // 3. On appelle ton agent avec les données du body
        String resultResponse = simoviteAgent.chat(request.message(), request.sessionId());

        // 4. On prépare un objet JSON de retour qui correspond à l'interface ChatResponse d'Angular
        Map<String, String> response = new HashMap<>();
        response.put("reply", resultResponse);
        response.put("sessionId", request.sessionId());

        return ResponseEntity.ok(response);
    }
}
