import { Kafka } from "kafkajs";
import { kafkaConfig, VERIFICATION_MESSAGE } from "../../config/kafka.config";

export const kafka = new Kafka(kafkaConfig);