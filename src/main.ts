import { getCollectionRecordsByBlockId } from "./adapters.ts";
import { getNotionData, setNotifier, setNotionData } from "./db.ts";
import {
  constructMessage,
  findCreatedNotionRecords,
  findDeletedNotionRecords,
  findNotionRecordsWithModifiedProperty,
} from "./notifier.ts";
import { NotifierConditionSet } from "./types.ts";

const USER_ID = "d41370d6-c88b-498f-b34b-a56409dfc94e";
const BLOCK_ID = "0e197ea2-e5a5-4a45-b2f9-ca04c3adedff";
const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1252337363984846969/psQLkmmTR0X-kjd1n9kfd_0vZYhzjscukIr8hADfZzS8qqJkTxHbWRtFWAhCu2y2HVOd";

const notifierId = crypto.randomUUID();
const notifierConditionSet: NotifierConditionSet = [
  {
    condition: { change: "created" },
    message: [
      { type: "text", value: "**" },
      {
        type: "property",
        fromRecord: "new",
        propertyId: "_created_by",
      },
      { type: "text", value: "** created task *" },
      { type: "property", fromRecord: "new", propertyId: "title" },
      { type: "text", value: "*" },
    ],
  },
];

// function getModifiedRecordsByProperty({ oldRecords, newRecords, propertyId }: {
//   oldRecords: CollectionRecordsMap;
//   newRecords: CollectionRecordsMap;
//   propertyId: string;
// }): CollectionRecordsDiff {
//   const blockIds = new Set([
//     ...Object.keys(oldRecords),
//     ...Object.keys(newRecords),
//   ]);

//   const modifiedRecords: CollectionRecordsDiff = new Map();

//   for (const blockId of blockIds) {
//     const oldRecord = oldRecords.get(blockId);
//     const newRecord = newRecords.get(blockId);

//     if (
//       oldRecord?.properties[propertyId] !== newRecord?.properties[propertyId]
//     ) {
//       modifiedRecords.set(blockId, { old: oldRecord, new: newRecord });
//     }
//   }

//   return modifiedRecords;
// }

await setNotionData(
  BLOCK_ID,
  await getCollectionRecordsByBlockId({
    blockId: BLOCK_ID,
    userId: USER_ID,
  }),
);

console.log("Got the Notion data");

// await setNotifier({
//   notionBlock: BLOCK_ID,
//   discordWebhook: WEBHOOK_URL,
//   notionCookie: Deno.env.get("COOKIE")!,
//   notifierId,
//   notifierConditionSet,
// });

// Sleep for 15 seconds
await new Promise((resolve) => setTimeout(resolve, 10000));

const oldNotionData = (await getNotionData(BLOCK_ID))!;
const newNotionData = await getCollectionRecordsByBlockId({
  blockId: BLOCK_ID,
  userId: USER_ID,
});

for (const r of findCreatedNotionRecords(oldNotionData, newNotionData)) {
  console.log(
    await constructMessage({
      message: notifierConditionSet[0].message,
      newRecord: r,
    }),
  );
}

// console.log("Modified:");
// console.log(
//   findNotionRecordsWithModifiedProperty(
//     oldNotionData,
//     newNotionData,
//     "notion://tasks/assign_property",
//   )
//     .map(({ old, new: new_ }) =>
//       `${old.properties.get("notion://tasks/assign_property")?.value} -> ${
//         new_.properties.get("notion://tasks/assign_property")?.value
//       }`
//     ),
// );

// console.log("Deleted:");
// console.log(
//   findDeletedNotionRecords(oldNotionData, newNotionData).map((r) =>
//     r.properties.get("title")!.value
//   ),
// );

// Deno.cron("Sync Notion data", "* * * * *", async () => {
//   const notionDataEntries = kv.list<CollectionRecordsMap>({
//     prefix: ["notion-data"],
//   });

//   for await (const notionDataEntry of notionDataEntries) {
//     const [_, blockId] = notionDataEntry.key;
//     const oldRecords = notionDataEntry.value;
//     const newRecords = await getCollectionRecordsByBlockId({
//       blockId: blockId as string,
//       userId: USER_ID,
//     });

//     const listenerEntries = kv.list<PropertyUpdateMessages>({
//       prefix: ["discord-listener", blockId],
//     });

//     for await (const listenerEntry of listenerEntries) {
//       const [_, __, discordWebhook, notionCookie] = listenerEntry.key;
//       const listener = listenerEntry.value;
//       const recordModified = false;
//       const modifiedRecords = getModifiedRecordsByProperty({
//         oldRecords,
//         newRecords,
//         propertyId: listener.propertyId,
//       });

//       for (const [blockId, { old, new }] of modifiedRecords) {
//       }
//     }
//   }
// });
