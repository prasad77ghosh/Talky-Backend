import { kafka } from "./kafka";
import { EachMessageHandler, Consumer, EachMessagePayload } from "kafkajs";
import { kafkaProducer } from "./producer";
import { withRetry, NonRetryableError, RetryPolicy } from "../../common/utils/retry.utils";

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
     * 1. Attempts to process the message multiple times with exponential backoff and jitter.
     * 2. If all retries fail, it pushes the message to a DLQ topic.
     * 3. This ensures "poison pill" messages don't block the consumer indefinitely.
     */
    async runWithRetry(handler: KafkaMessageProcessor, retryPolicy?: Partial<RetryPolicy>) {
        await this.consumer.run({
            eachMessage: async (payload: EachMessagePayload) => {
                const { topic, partition, message } = payload;

                try {
                    await withRetry(
                        async (attempt) => {
                            await handler(payload);
                        },
                        retryPolicy,
                        (error, attempt, delay) => {
                            console.warn(
                                `⏳ [${this.groupId}] Retry ${attempt} for ${topic} in ${Math.round(delay)}ms due to: ${error instanceof Error ? error.message : "Unknown error"}`
                            );
                        }
                    );
                } catch (error) {
                    if (error instanceof NonRetryableError) {
                        console.error(`❌ [${this.groupId}] Non-retryable error for topic ${topic}: ${error.message}`);
                    } else {
                        console.error(
                            `❌ [${this.groupId}] Max retries reached for topic ${topic}.`,
                        );
                    }

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
                                error: error instanceof Error ? error.message : String(error),
                                payload: message.value?.toString(),
                                timestamp: new Date().toISOString(),
                                isPermanentFailure: error instanceof NonRetryableError,
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
            },
        });
    }

    /**
     * Specialized runner for Dead Letter Queue (DLQ) messages.
     * It automatically subscribes to `${topic}.dlq` and passes the extracted original payload to the handler.
     */
    async runDLQ(originalTopic: string, handler: (payload: any) => Promise<void>) {
        const dlqTopic = `${originalTopic}.dlq`;
        await this.subscribe(dlqTopic);

        console.log(`🛠️ [Recovery] DLQ Consumer started for ${dlqTopic}`);

        await this.runWithRetry(async ({ message }: EachMessagePayload) => {
            const value = message.value?.toString();
            if (!value) return;

            try {
                const dlqData = JSON.parse(value);
                const originalPayloadString = dlqData.payload;
                
                if (!originalPayloadString) {
                    console.error(`❌ [Recovery] No original payload found in DLQ message on ${dlqTopic}`);
                    return;
                }

                const originalPayload = JSON.parse(originalPayloadString);
                await handler(originalPayload);
            } catch (error) {
                console.error(`❌ [Recovery] Failed to process DLQ message from ${dlqTopic}:`, error);
                throw error; // Let runWithRetry handle it
            }
        });
    }

    /**
     * Static helper to quickly start a DLQ consumer.
     */
    static async startDLQ(topic: string, groupId: string, handler: (payload: any) => Promise<void>) {
        const consumer = new KafkaConsumer(groupId);
        await consumer.connect();
        await consumer.runDLQ(topic, handler);
        return consumer;
    }

    async disconnect() {
        await this.consumer.disconnect();
        console.log(`✅ Kafka Consumer [${this.groupId}] Disconnected`);
    }
}
