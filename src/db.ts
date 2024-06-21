import { NotionCollection } from "./types.ts";

export const kv = await Deno.openKv();

export async function getNotionData(
  notionBlock: string,
): Promise<NotionCollection | undefined> {
  const result = await kv.get<NotionCollection>(
    ["notion-data", notionBlock],
  );

  return result.value ?? undefined;
}

export async function setNotionData(
  notionBlock: string,
  notionRecords: NotionCollection,
) {
  await kv.set(["notion-data", notionBlock], notionRecords);
}

export async function clearNotionData(notionBlock: string) {
  await kv.delete(["notion-data", notionBlock]);
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
