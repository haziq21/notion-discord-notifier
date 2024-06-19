/**
 * High-level functions for interacting with Notion.
 */

import {
  getBacklinksForBlock,
  queryCollection,
  syncRecordValues,
} from "./notion.ts";
import {
  CollectionRecordsMap,
  RecordPropertiesMap,
  RecordProperty,
} from "./types.ts";

export async function getUsernamesFromIds(
  ids: string[],
): Promise<Record<string, string>> {
  const data = (await syncRecordValues(ids)).recordMap.notion_user!;

  return Object.values(data)
    .reduce((accum, { value: { id, name } }) => ({ [id]: name, ...accum }), {});
}

export async function getContainerIdsForBlock(
  blockId: string,
): Promise<{ spaceId: string; collectionId: string; viewIds: string[] }> {
  const data =
    (await getBacklinksForBlock(blockId)).recordMap.block[blockId].value;

  if (!data.collection_id) {
    throw new Error(`Block ${blockId} has no collection ID`);
  }

  return {
    spaceId: data.space_id,
    collectionId: data.collection_id,
    viewIds: data.view_ids ?? [],
  };
}

export async function getRecordsInCollection({
  collectionId,
  spaceId,
  userId,
}: {
  collectionId: string;
  spaceId: string;
  userId: string;
}): Promise<CollectionRecordsMap> {
  const data = (await queryCollection({
    collectionId,
    spaceId,
    userId,
    viewId: "",
  })).recordMap;

  const records: CollectionRecordsMap = new Map();

  for (const block of Object.values(data.block)) {
    // Skip blocks that aren't part of the collection
    if (block.value.is_template || block.value.parent_table !== "collection") {
      continue;
    }

    const properties: RecordPropertiesMap = new Map();

    properties.set("_created_by", {
      name: "Created by",
      type: "person",
      value: [block.value.created_by_id],
    });

    // Process the properties of the current record
    for (const [id, value] of Object.entries(block.value.properties)) {
      // Skip deleted properties
      if (!Object.hasOwn(data.collection[collectionId].value.schema, id)) {
        continue;
      }

      // Get the property name and type from the schema provided in the response
      const { name, type } = data.collection[collectionId].value.schema[id];

      properties.set(id, {
        name,
        type,
        value,
      } as RecordProperty);
    }

    records.set(block.value.id, {
      icon: block.value.format.page_icon,
      properties,
    });
  }

  return records;
}

export async function getCollectionRecordsByBlockId({ blockId, userId }: {
  blockId: string;
  userId: string;
}): Promise<CollectionRecordsMap> {
  const { spaceId, collectionId } = await getContainerIdsForBlock(blockId);

  return getRecordsInCollection({
    collectionId,
    spaceId,
    userId,
  });
}
