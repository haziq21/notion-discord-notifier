import { Client } from "npm:@notionhq/client";
import {
  PageObjectResponse,
  UserObjectResponse,
} from "npm:@notionhq/client/build/src/api-endpoints";
import { NotionCollection, NotionId, NotionRecord } from "./types.ts";

const notion = new Client({ auth: Deno.env.get("NOTION_TOKEN") });

// export async function getUsernameFromId(userId: string): Promise<string> {
//   const name = (await notion.users.retrieve({ user_id: userId })).name;

//   if (!name) {
//     throw new Error(`Couldn't fetch username for user ${userId}`);
//   }

//   return name;
// }

/**
 * Receives the API response from Notion and transforms it into a `NotionRecord`.
 */
function transformRawRecord(rawRecord: PageObjectResponse): NotionRecord {
  const record = new NotionRecord({
    id: rawRecord.id,
    url: rawRecord.url,
    icon: rawRecord.icon?.type === "emoji" ? rawRecord.icon.emoji : undefined,
  });

  // Initialize the properties of the record
  for (const [name, rawProp] of Object.entries(rawRecord.properties)) {
    const { id, type } = rawProp;
    const partialProp = { id, name };

    if (type === "title") {
      record.setTextProp({
        ...partialProp,
        text: rawProp.title.map((t) => t.plain_text).join(""),
      });
    } else if (type === "status") {
      record.setTextProp({
        ...partialProp,
        text: rawProp.status?.name ?? "<blank>",
      });
    } else if (type === "date") {
      // Ignore unset dates
      if (rawProp.date?.start === undefined) {
        continue;
      }

      record.setDateProp({
        ...partialProp,
        date: new Date(rawProp.date.start),
      });
    } else if (type === "created_time") {
      record.setDateProp({
        ...partialProp,
        date: new Date(rawProp.created_time),
      });
    } else if (type === "people") {
      // Ignore empty people lists
      if (rawProp.people.length === 0) {
        continue;
      }

      record.setPeopleProp({
        ...partialProp,
        people: rawProp.people.map((p) => ({
          id: p.id,
          name: (p as UserObjectResponse).name ?? "<unknown>",
        })),
      });
    } else if (type === "created_by") {
      record.setPeopleProp({
        ...partialProp,
        people: [
          {
            id: rawProp.created_by.id,
            name: (rawProp.created_by as UserObjectResponse)
              .name ?? "<unknown>",
          },
        ],
      });
    } else if (type === "relation") {
      // Ignore empty relation lists
      if (rawProp.relation.length === 0) {
        continue;
      }

      record.setRelationProp({
        ...partialProp,
        relations: rawProp.relation.map((r) => r.id),
      });
    } else {
      console.warn(`Skipping unknown property type: ${type} (${name})`);
      continue;
    }
  }

  return record;
}

export async function fetchCollection(
  databaseId: string,
): Promise<NotionCollection> {
  const data = await notion.databases.query({
    database_id: databaseId,
  });

  const collection: NotionCollection = new Map();

  for (const page of data.results as PageObjectResponse[]) {
    collection.set(page.id, transformRawRecord(page));
  }

  return collection;
}

export async function fetchRecord(pageId: NotionId): Promise<NotionRecord> {
  return transformRawRecord(
    await notion.pages.retrieve({ page_id: pageId }) as PageObjectResponse,
  );
}

export async function fetchRecordIfNotInTrash(
  pageId: NotionId,
): Promise<NotionRecord | undefined> {
  const page = await notion.pages.retrieve({
    page_id: pageId,
  }) as PageObjectResponse;

  if (page.in_trash) {
    return undefined;
  }

  return transformRawRecord(page);
}
