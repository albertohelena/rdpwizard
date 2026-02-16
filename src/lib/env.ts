export function getRequiredEnv(name: string): string {
    const val = process.env[name];
    if (!val) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return val;
}

export function getOptionalEnv(name: string): string | undefined {
    return process.env[name];
}
