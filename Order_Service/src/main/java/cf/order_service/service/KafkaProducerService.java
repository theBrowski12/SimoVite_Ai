package cf.order_service.service;

import cf.order_service.kafkaEvents.OrderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    // Le Topic doit être créé dans Kafka ou via config Spring
    private static final String TOPIC_NAME = "order-topics";

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void sendOrderEvent(OrderEvent event) {
        log.info(String.format("Envoi de l'événement vers Kafka => %s", event.toString()));

        // Création du message avec des Headers (optionnel mais recommandé)
        Message<OrderEvent> message = MessageBuilder
                .withPayload(event)
                .setHeader(KafkaHeaders.TOPIC, TOPIC_NAME)
                .build();

        kafkaTemplate.send(message);
    }
}
