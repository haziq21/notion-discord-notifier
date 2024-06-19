import { getUsernamesFromIds } from "./adapters.ts";
import { CollectionRecordsMap, NotifierConfig } from "./types.ts";

export const kv = await Deno.openKv();

export async function getNotionData(
  notionBlock: string,
): Promise<CollectionRecordsMap | undefined> {
  const result = await kv.get<CollectionRecordsMap>(
    ["notion-data", notionBlock],
  );

  return result.value ?? undefined;
}

export async function setNotionData(
  notionBlock: string,
  notionRecords: CollectionRecordsMap,
) {
  await kv.set(["notion-data", notionBlock], notionRecords);
}

export async function setNotifier({
  notionBlock,
  notionCookie,
  discordWebhook,
  notifierConditionSet,
  notifierId,
}: NotifierConfig) {
  await kv.set(["notifiers", notifierId], {
    notionBlock,
    notionCookie,
    discordWebhook,
    notifierConditionSet,
  });
}

export async function getNotionUsername(notionUserId: string): Promise<string> {
  const result = await kv.get<string>(["notion-users", notionUserId]);

  // Return the username if it's already cached
  if (result.value !== null) {
    return result.value;
  }

  // Fetch the username from the Notion API
  const username = (await getUsernamesFromIds([notionUserId]))[notionUserId]!;

  // Update cache
  await kv.set(["notion-users", notionUserId], username);

  return username;
}
