import Redis from "ioredis";
import { redisConfig } from "../../config/redis.config";

class RedisConnection {
    private static instance: RedisConnection;
    private redis: Redis;

    private constructor() {
        this.redis = new Redis({
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.redis.on("connect", () => {
            console.log("✅ Redis Connected");
        });

        this.redis.on("error", (error) => {
            console.error("❌ Redis Error:", error);
        });
    }

    public static getInstance(): RedisConnection {
        if (!RedisConnection.instance) {
            RedisConnection.instance = new RedisConnection();
        }
        return RedisConnection.instance;
    }

    public getClient(): Redis {
        return this.redis;
    }

    public async disconnect() {
        await this.redis.quit();
        console.log("✅ Redis Disconnected");
    }
}

export const redisConnection = RedisConnection.getInstance();
export const redisClient = redisConnection.getClient();
