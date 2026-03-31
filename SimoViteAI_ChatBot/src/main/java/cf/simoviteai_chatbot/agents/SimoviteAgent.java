package cf.simoviteai_chatbot.agents;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class SimoviteAgent {

    // FIX 1: Change type to ChatClient (this is why .prompt() failed)
    private final ChatClient chatClient;

    // FIX 2: Use @Qualifier to tell Spring to use Groq/OpenAI specifically
    public SimoviteAgent(@Qualifier("openAiChatModel") ChatModel chatModel,
                         ChatMemory chatMemory,
                         ToolCallbackProvider tools) {

        System.out.println("🔧 Tools disponibles : " + tools.getToolCallbacks().length);

        // FIX 3: Use the .builder() for the advisor (the constructor is private)
        this.chatClient = ChatClient.builder(chatModel)
                .defaultSystem("""
                    Tu es SimoVite Assistant, plateforme de livraison marocaine.
                    - Utilise TOUJOURS les tools pour répondre — jamais manuellement.
                    - Utilise UNIQUEMENT le nom de l'outil
                    - Réponds en français, de façon simple.
                    - Ne montre jamais de code, JSON ou détails techniques.
                    - Si résultat vide, dis-le simplement.
                    RÈGLE CRUCIALE POUR getReviews :
                    L'outil 'getReviews' prends deux paramètres : 'targetId' et 'targetType'.
                    Si l'utilisateur demande TOUS les avis ou une demande générale :
                      - targetId : utilise impérativement la valeur "all"
                      - targetType : utilise impérativement la valeur "PRODUCT"
                        
                                    N'appelle JAMAIS getReviews avec des parenthèses vides ().    
                    """)
                //.defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .defaultToolCallbacks(tools.getToolCallbacks())
                .build();
    }

    // Remplace ResponseEntity<String> par String
    public String chat(String userMessage, String conversationId) {
        String resultResponse = this.chatClient
                .prompt()
                .user(userMessage)
                .advisors(a -> a.param("chat_memory_conversation_id", conversationId))
                .call()
                .content();

        // Renvoie directement le texte !
        return resultResponse;
    }
}
