import { WebhookClient } from "npm:discord.js";
import { APIMessage } from "npm:discord-api-types";

const webhookClient = new WebhookClient({
    url: Deno.env.get("DISCORD_WEBHOOK")!,
});

export async function sendDiscordMessage(message: string): Promise<APIMessage> {
    return await webhookClient.send({
        content: message,
        avatarURL:
            "https://github.com/haziq21/notion-discord-notifier/blob/main/assets/notion-logo.png?raw=true",
    });
}
