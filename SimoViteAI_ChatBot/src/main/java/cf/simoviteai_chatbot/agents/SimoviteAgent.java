package cf.simoviteai_chatbot.agents;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Service
public class SimoviteAgent {
    private ChatClient ollamaClient;

    public SimoviteAgent(OllamaChatModel ollamaChatModel, ChatMemory chatMemory
    , ToolCallbackProvider tools) {
        this.ollamaClient = ChatClient.builder(ollamaChatModel)
                .defaultSystem("""
                        Tu es l'assistant administrateur de la plateforme SimoVite. Tu as accès à des outils (tools) pour gérer le catalogue et les magasins. Règle ABSOLUE : Quand un utilisateur te demande de créer, lire, modifier ou supprimer quelque chose, tu DOIS obligatoirement utiliser l'outil correspondant pour le faire à sa place. Ne dis jamais à l'utilisateur de le faire manuellement. 
                        """)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .defaultToolCallbacks(tools)
                .build();
    }

    public ResponseEntity<String> chat(
            Prompt prompt,
            String conversationId) {
        var resultResponse = this.ollamaClient
                .prompt(prompt)
                .advisors(a -> a.param("chat_memory_conversation_id", conversationId))
                .call()
                .content();
        return ResponseEntity.ok(resultResponse);
    }
}
