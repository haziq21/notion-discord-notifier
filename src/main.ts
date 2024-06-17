import { getContainerIdsForBlock, getRecordsInCollection } from "./adapters.ts";

const { spaceId, collectionId } = await getContainerIdsForBlock(
  "0e197ea2-e5a5-4a45-b2f9-ca04c3adedff",
);

const records = await getRecordsInCollection({
  collectionId,
  spaceId,
  userId: "d41370d6-c88b-498f-b34b-a56409dfc94e",
});

console.log(`Found ${records.length} records:`);
console.log(
  records.map((r) =>
    `${r.properties["title"].value} (${
      r.properties["notion://tasks/status_property"].value
    })`
  ).join("\n"),
);
