import { ConnectOptions } from "mongoose";
import { db_url } from ".";

export class DatabaseConfig {
    public static readonly uri: string =
        db_url as string;

    public static readonly options: ConnectOptions = {
        autoIndex: true,
        maxPoolSize: 10,
    };
}