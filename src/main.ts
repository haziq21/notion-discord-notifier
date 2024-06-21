import {
  getNotionData,
  listenForNotifUpdateEvents,
  queueNotificationUpdate,
  setNotionData,
} from "./db.ts";
import {
  findCreatedNotionRecords,
  findDeletedNotionRecords,
  findNotionRecordsWithModifiedProperty,
  propertyWasModified,
} from "./notifier.ts";
import { fetchCollection, fetchRecordIfNotInTrash } from "./notion.ts";
import hash from "https://deno.land/x/object_hash@2.0.3.1/mod.ts";

import notifierConfig from "./notifierConfig.ts";
import {
  NotificationUpdateEvent,
  NotionCollection,
  NotionRecord,
} from "./types.ts";
import { deleteDiscordMessage, sendDiscordMessage } from "./discord.ts";
import { editDiscordMessage } from "./discord.ts";

Deno.cron("Sync Notion data and notify", "* * * * *", async () => {
  console.log("Starting cron job...");

  const databasesToRefresh = new Set(
    notifierConfig.map((conf) => conf.notionDatabaseId),
  );

  console.log(`Found ${databasesToRefresh.size} database(s) to refresh`);

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
    console.log(
      `Processing notifier config for database ${conf.notionDatabaseId}`,
    );
    const oldCollection = oldCollections[conf.notionDatabaseId];
    const newCollection = newCollections[conf.notionDatabaseId];

    // Skip collections that weren't already in the database
    if (oldCollection === undefined) {
      console.log(
        `Skipping collection ${conf.notionDatabaseId} (not in database)`,
      );
      continue;
    }

    if (conf.trigger === "propertyModified") {
      console.log(`Checking for modified records in ${conf.notionDatabaseId}`);

      const modifiedRecords = findNotionRecordsWithModifiedProperty(
        oldCollection,
        newCollection,
        conf.modifiedPropertyId,
      );

      console.log(`Found ${modifiedRecords.length} modified records`);

      for (const recordDiff of modifiedRecords) {
        sendDiscordMessage(conf.message(recordDiff));

        if (conf.updateWindow !== undefined) {
          await queueNotificationUpdate(10_000, {
            notifierConfigHash: hash(conf),
            notifInitiallySentTime: Date.now(),
            notionRecordId: recordDiff.newRecord.id,
            discordMessageId: "",
            serialisedOldRecord: recordDiff.oldRecord.serialize(),
          });
        }
      }
    } else if (conf.trigger === "created") {
      const createdRecords = findCreatedNotionRecords(
        oldCollection,
        newCollection,
      );

      for (const record of createdRecords) {
        sendDiscordMessage(conf.message(record));

        if (conf.updateWindow !== undefined) {
          await queueNotificationUpdate(10_000, {
            notifierConfigHash: hash(conf),
            notifInitiallySentTime: Date.now(),
            notionRecordId: record.id,
            discordMessageId: "",
            serialisedOldRecord: record.serialize(),
          });
        }
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

  console.log("Done sending notifications");

  // Update the database with the new data
  for (const id of databasesToRefresh) {
    await setNotionData(id, newCollections[id]);
  }

  console.log("Updated database with new data");
});

listenForNotifUpdateEvents(async ({
  notifierConfigHash,
  notifInitiallySentTime,
  serialisedOldRecord,
  notionRecordId,
  discordMessageId,
}: NotificationUpdateEvent) => {
  console.log(
    `Received notification update event for record ${notionRecordId}`,
  );

  const conf = notifierConfig.find((c) => hash(c) === notifierConfigHash);

  // Drop the updates if the config is missing (i.e. a new git commit removed it)
  if (conf === undefined) {
    console.error("Notifier config not found for hash", notifierConfigHash);
    return;
  }

  const newRecord = await fetchRecordIfNotInTrash(notionRecordId);

  // Delete the sent message if the record was just deleted
  // This assumes that messages aren't sent for deleted records
  if (newRecord === undefined) {
    deleteDiscordMessage(discordMessageId);
    return;
  }

  if (conf.trigger === "propertyModified") {
    const oldRecord = new NotionRecord(serialisedOldRecord);

    if (propertyWasModified(oldRecord, newRecord, conf.modifiedPropertyId)) {
      // Update the message if the property is still different after the update
      console.log(`Updating Discord message ${discordMessageId}`);
      editDiscordMessage(
        discordMessageId,
        conf.message({ oldRecord, newRecord }),
      );
    } else {
      // Delete the message if the change was reverted
      deleteDiscordMessage(discordMessageId);
    }
  } else if (conf.trigger === "created") {
    editDiscordMessage(discordMessageId, conf.message(newRecord));
  }

  // The update window has to be specified for this function to be called
  if (conf.updateWindow === undefined) {
    throw new Error("Update window not specified but update event received");
  }

  // Stop updating messages after the update window has passed
  if (Date.now() > notifInitiallySentTime + conf.updateWindow * 1000) {
    return;
  }

  // Schedule another message update
  await queueNotificationUpdate(10_000, {
    notifierConfigHash,
    notifInitiallySentTime,
    notionRecordId,
    discordMessageId,
    serialisedOldRecord,
  });
});
