package cf.simoviteai_chatbot.discord;

import cf.simoviteai_chatbot.agents.SimoviteAgent;
import com.zgamelogic.discord.annotations.DiscordController;
import com.zgamelogic.discord.annotations.DiscordMapping;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import org.springframework.ai.chat.prompt.Prompt;

import java.util.concurrent.CompletableFuture;

@DiscordController
public class DiscordBot {

    private final SimoviteAgent simoviteAgent;

    public DiscordBot(SimoviteAgent simoviteAgent) {
        this.simoviteAgent = simoviteAgent;
    }

    @DiscordMapping
    private void perform(MessageReceivedEvent event) {
        if (event.getAuthor().isBot()) return;

        String query = event.getMessage().getContentRaw();
        String conversationId = event.getAuthor().getId();

        // ✅ Répond immédiatement pour garder la connexion Discord vivante
        event.getChannel().sendTyping().queue();

        // ✅ Traite la requête dans un thread séparé
        CompletableFuture.runAsync(() -> {
            try {
                String response = simoviteAgent.chat(query, conversationId);
                if (response != null && !response.isEmpty()) {
                    event.getChannel().sendMessage(response).queue();
                }
            } catch (Exception e) {
                System.err.println("Erreur avec l'agent IA : " + e.getMessage());
                event.getChannel().sendMessage("Oups, mon cerveau est temporairement indisponible. 🧠").queue();
            }
        });
    }
}
