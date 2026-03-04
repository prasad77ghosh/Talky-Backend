import { kafka } from "./kafka";
import { EachMessageHandler, EachMessagePayload } from "kafkajs";

class KafkaConsumer {
    private consumer = kafka.consumer({ groupId: "auth-group" });

    async connect() {
        await this.consumer.connect();
        console.log("✅ Kafka Consumer Connected");
    }

    async subscribe(topic: string) {
        await this.consumer.subscribe({ topic, fromBeginning: true });
        console.log(`📡 Subscribed to topic: ${topic}`);
    }

    async run(handler: EachMessageHandler) {
        await this.consumer.run({
            eachMessage: handler,
        });
    }

    async disconnect() {
        await this.consumer.disconnect();
        console.log("✅ Kafka Consumer Disconnected");
    }
}

export const kafkaConsumer = new KafkaConsumer();
