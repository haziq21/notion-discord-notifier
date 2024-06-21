import {
  NotificationUpdateEvent,
  NotionCollection,
  NotionId,
  NotionRecord,
  SerializedNotionCollection,
} from "./types.ts";

export const kv = await Deno.openKv();

export async function getNotionData(
  databaseId: NotionId,
): Promise<NotionCollection | undefined> {
  const result = await kv.get<SerializedNotionCollection>(
    ["notion-data", databaseId],
  );

  if (result.value === null) {
    console.warn(`No data found in Deno KV for collection ${databaseId}`);
    return undefined;
  }

  const collection: NotionCollection = new Map();

  for (const [recordId, serialized] of result.value.entries()) {
    collection.set(recordId, new NotionRecord(serialized));
  }

  return collection;
}

export async function setNotionData(
  databaseId: NotionId,
  notionCollection: NotionCollection,
) {
  const serializedCollection: SerializedNotionCollection = new Map();

  for (const [recordId, record] of notionCollection.entries()) {
    serializedCollection.set(recordId, record.serialize());
  }

  await kv.set(["notion-data", databaseId], serializedCollection);
}

export async function listStoredNotionCollections(): Promise<string[]> {
  const collections: string[] = [];

  for await (const { key } of kv.list({ prefix: ["notion-data"] })) {
    collections.push(String(key[1]));
  }

  return collections;
}

export async function clearAllNotionData() {
  for await (const { key } of kv.list({ prefix: ["notion-data"] })) {
    await kv.delete(key);
  }
}

export async function queueNotificationUpdate(
  delay: number,
  updateEvent: NotificationUpdateEvent,
) {
  await kv.enqueue(updateEvent, { delay });
}

export function listenForNotifUpdateEvents(
  callback: (payload: NotificationUpdateEvent) => Promise<void>,
) {
  console.log("Attaching queue listener");
  kv.listenQueue(callback);
}

// export async function getNotionUsername(notionUserId: string): Promise<string> {
//   const result = await kv.get<string>(["notion-users", notionUserId]);

//   // Return the username if it's already cached
//   if (result.value !== null) {
//     return result.value;
//   }

//   // Fetch the username from the Notion API
//   const username = await getUsernameFromId(notionUserId);

//   // Update cache
//   await kv.set(["notion-users", notionUserId], username);

//   return username;
// }
