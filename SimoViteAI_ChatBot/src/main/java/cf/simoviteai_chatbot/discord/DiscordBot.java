package cf.simoviteai_chatbot.discord;

import cf.simoviteai_chatbot.agents.SimoviteAgent;
import com.zgamelogic.discord.annotations.DiscordController;
import com.zgamelogic.discord.annotations.DiscordMapping;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import org.springframework.ai.chat.prompt.Prompt;

@DiscordController
public class DiscordBot {

    private final SimoviteAgent simoviteAgent;

    public DiscordBot(SimoviteAgent simoviteAgent) {
        this.simoviteAgent = simoviteAgent;
    }

    @DiscordMapping
    private void perform(MessageReceivedEvent event) {
        // 1. On ignore les messages des bots (très important pour éviter les boucles infinies)
        if (event.getAuthor().isBot()) return;

        System.out.println("[SimoViteAiChatBot] Message reçu de : " + event.getAuthor().getName());

        // 2. On récupère le texte tapé par l'utilisateur
        String query = event.getMessage().getContentRaw();

        // 3. On utilise l'ID unique de l'utilisateur Discord comme ID de conversation
        // Ça permet à l'IA d'avoir une mémoire séparée pour chaque personne !
        String conversationId = event.getAuthor().getId();

        try {
            // 4. On appelle l'agent et on fait .getBody() pour extraire le texte du ResponseEntity
            String response = simoviteAgent.chat(new Prompt(query), conversationId).getBody();

            // 5. On renvoie la réponse sur Discord
            if (response != null && !response.isEmpty()) {
                event.getChannel().sendMessage(response).queue();
            }
        } catch (Exception e) {
            System.err.println("Erreur avec l'agent IA : " + e.getMessage());
            event.getChannel().sendMessage("Oups, mon cerveau est temporairement indisponible. 🧠").queue();
        }
    }
}
