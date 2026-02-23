export interface EmailTokenPayload {
    sub: string | undefined;
    version: number | undefined;
    type: "email_verification";
}