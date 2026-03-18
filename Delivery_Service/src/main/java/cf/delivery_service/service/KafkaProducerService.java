package cf.delivery_service.service;

import cf.delivery_service.kafkaEvents.DeliveryNotificationEvent;
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

    private static final String TOPIC_NAME = "delivery-topics";

    private final KafkaTemplate<String, DeliveryNotificationEvent> kafkaTemplate;

    public void sendDeliveryEvent(DeliveryNotificationEvent event) {
        log.info(String.format("🚀 Envoi de l'événement de livraison vers Kafka => %s", event.toString()));

        // Création du message avec les Headers officiels Spring Kafka
        Message<DeliveryNotificationEvent> message = MessageBuilder
                .withPayload(event)
                .setHeader(KafkaHeaders.TOPIC, TOPIC_NAME)
                .build();

        kafkaTemplate.send(message);
    }
}
