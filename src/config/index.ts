import "dotenv/config";
export const port = Number(process.env.PORT);
export const db_url = String(process.env.DB_URL);
export const node_env = String(process.env.NODE_ENV);
export const jwt_access_secret = String(process.env.JWT_ACCESS_SECRET);
export const jwt_refresh_secret = String(process.env.JWT_REFRESH_SECRET);
export const jwt_email_secret = String(process.env.JWT_EMAIL_SECRET);