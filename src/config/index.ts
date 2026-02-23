import "dotenv/config";
export const port = Number(process.env.PORT);
export const db_url = String(process.env.DB_URL);
export const node_env = String(process.env.NODE_ENV);
