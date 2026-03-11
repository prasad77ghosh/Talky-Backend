import { kafka } from "./kafka";
import { EachMessageHandler, Consumer, EachMessagePayload } from "kafkajs";
import { kafkaProducer } from "./producer";

export type KafkaMessageProcessor = (
    payload: EachMessagePayload,
) => Promise<void>;

export class KafkaConsumer {
    private consumer: Consumer;
    private groupId: string;

    constructor(groupId: string) {
        this.groupId = groupId;
        this.consumer = kafka.consumer({ groupId });
    }

    async connect() {
        await this.consumer.connect();
        console.log(`✅ Kafka Consumer [${this.groupId}] Connected`);
    }

    async subscribe(topic: string) {
        await this.consumer.subscribe({ topic, fromBeginning: true });
        console.log(`📡 [${this.groupId}] Subscribed to topic: ${topic}`);
    }

    /**
     * Runs the consumer with an automatic retry and DLQ (Dead Letter Queue) mechanism.
     * 1. Attempts to process the message multiple times with exponential backoff.
     * 2. If all retries fail, it pushes the message to a DLQ topic.
     * 3. This ensures "poison pill" messages don't block the consumer indefinitely.
     */
    async runWithRetry(handler: KafkaMessageProcessor, maxRetries = 3) {
        await this.consumer.run({
            eachMessage: async (payload: EachMessagePayload) => {
                const { topic, partition, message } = payload;
                let attempt = 0;

                while (attempt <= maxRetries) {
                    try {
                        await handler(payload);
                        return; // Success, exit the loop
                    } catch (error) {
                        attempt++;

                        if (attempt <= maxRetries) {
                            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
                            console.warn(
                                `⏳ [${this.groupId}] Retry ${attempt}/${maxRetries} for ${topic} in ${delay}ms due to: ${error instanceof Error ? error.message : "Unknown error"}`,
                            );
                            await new Promise((res) => setTimeout(res, delay));
                        } else {
                            console.error(
                                `❌ [${this.groupId}] Max retries (${maxRetries}) reached for topic ${topic}.`,
                            );

                            const dlqTopic = `${topic}.dlq`;
                            try {
                                console.log(
                                    `⚠️ [${this.groupId}] Moving message to DLQ: ${dlqTopic}`,
                                );

                                await kafkaProducer.send(
                                    dlqTopic,
                                    message.key?.toString() || "dlq-key",
                                    {
                                        originalTopic: topic,
                                        originalPartition: partition,
                                        originalOffset: message.offset,
                                        error:
                                            error instanceof Error ? error.message : String(error),
                                        payload: message.value?.toString(),
                                        timestamp: new Date().toISOString(),
                                        retryAttempts: maxRetries,
                                    },
                                );

                                console.log(
                                    `✅ [${this.groupId}] Message successfully moved to DLQ`,
                                );
                            } catch (dlqError) {
                                console.error(
                                    `🚨 [${this.groupId}] CRITICAL: Failed to push to DLQ!`,
                                    dlqError,
                                );
                                throw dlqError; // Crash consumer to prevent data loss
                            }
                        }
                    }
                }
            },
        });
    }

    async disconnect() {
        await this.consumer.disconnect();
        console.log(`✅ Kafka Consumer [${this.groupId}] Disconnected`);
    }
}
