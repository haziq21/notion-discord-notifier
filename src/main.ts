import { getNotionData, setNotionData } from "./db.ts";
import {
  findCreatedNotionRecords,
  findDeletedNotionRecords,
  findNotionRecordsWithModifiedProperty,
} from "./notifier.ts";
import { fetchCollection } from "./notion.ts";

import notifierConfig from "./notifierConfig.ts";
import { NotionCollection } from "./types.ts";
import { sendDiscordMessage } from "./discord.ts";

Deno.cron("Sync Notion data and notify", "* * * * *", async () => {
  const databasesToRefresh = new Set(
    notifierConfig.map((conf) => conf.notionDatabaseId),
  );

  const oldCollections: Record<string, NotionCollection | undefined> = {};
  const newCollections: Record<string, NotionCollection> = {};

  for (const id of databasesToRefresh) {
    oldCollections[id] = await getNotionData(id);
    newCollections[id] = await fetchCollection(id);
  }

  console.log(
    `Retrieved ${
      Object.keys(oldCollections).length
    } collections from Notion API`,
  );

  for (const conf of notifierConfig) {
    const oldCollection = oldCollections[conf.notionDatabaseId];
    const newCollection = newCollections[conf.notionDatabaseId];

    // Skip collections that weren't already in the database
    if (oldCollection === undefined) {
      continue;
    }

    if (conf.trigger === "propertyModified") {
      const modifiedRecords = findNotionRecordsWithModifiedProperty(
        oldCollection,
        newCollection,
        conf.modifiedPropertyId,
      );

      for (const recordDiff of modifiedRecords) {
        sendDiscordMessage(conf.message(recordDiff));
      }
    } else if (conf.trigger === "created") {
      const createdRecords = findCreatedNotionRecords(
        oldCollection,
        newCollection,
      );

      for (const record of createdRecords) {
        sendDiscordMessage(conf.message(record));
      }
    } else if (conf.trigger === "deleted") {
      const deletedRecords = findDeletedNotionRecords(
        oldCollection,
        newCollection,
      );

      for (const record of deletedRecords) {
        sendDiscordMessage(conf.message(record));
      }
    }
  }

  // Update the database with the new data
  for (const id of databasesToRefresh) {
    await setNotionData(id, newCollections[id]);
  }
});
