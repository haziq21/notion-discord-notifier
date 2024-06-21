import { WebhookClient } from "npm:discord.js";
import { APIMessage } from "npm:discord-api-types";

const webhookClient = new WebhookClient({
  url: Deno.env.get("DISCORD_WEBHOOK")!,
});
const avatarURL =
  "https://github.com/haziq21/notion-discord-notifier/blob/main/assets/notion-logo.png?raw=true";

export async function sendDiscordMessage(message: string): Promise<APIMessage> {
  console.log(`Sending Discord message: ${message}`);

  return await webhookClient.send({
    content: message,
    avatarURL,
  });
}

export async function editDiscordMessage(
  messageId: string,
  message: string,
): Promise<APIMessage> {
  console.log(`Editing Discord message ${messageId} to: ${message}`);
  return await webhookClient.editMessage(messageId, { content: message });
}

export async function deleteDiscordMessage(messageId: string) {
  console.log(`Deleting Discord message ${messageId}`);
  await webhookClient.deleteMessage(messageId);
}
