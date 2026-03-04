import { Partitioners } from "kafkajs";
import { kafka } from "./kafka";

class KafkaProducer {
    private producer = kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner,
    });

    async connect() {
        await this.producer.connect();
        console.log("✅ Kafka Producer Connected");
    }

    async send(topic: string, key: string, message: any) {
        await this.producer.send({
            topic,
            messages: [
                {
                    key,
                    value: JSON.stringify(message),
                },
            ],
        });
    }
    async disconnect() {
        await this.producer.disconnect();
        console.log("✅ Kafka Producer Disconnected");
    }
}

export const kafkaProducer = new KafkaProducer();