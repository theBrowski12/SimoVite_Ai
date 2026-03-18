package cf.simoviteai_chatbot.controllers;

import cf.simoviteai_chatbot.agents.SimoviteAgent;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class SimoviteChatbotController {
    private final SimoviteAgent simoviteAgent;

    public SimoviteChatbotController(SimoviteAgent simoviteAgent) {
        this.simoviteAgent = simoviteAgent;
    }


    @GetMapping("/chat")
    public ResponseEntity<String> chat(
            @RequestParam(value = "query", defaultValue = "Bonjour!") String query,
            @RequestParam(value = "conversationId", defaultValue = "default") String conversationId) {

        return simoviteAgent.chat(new Prompt(query), conversationId);
    }
}
