/**
 * High-level functions for interacting with Notion.
 */

import {
  getBacklinksForBlock,
  queryCollection,
  syncRecordValues,
} from "./notion.ts";
import { CollectionRecord, RecordProperties } from "./types.ts";

export async function getUsernamesFromIds(
  ids: string[],
): Promise<Map<string, string>> {
  const data = (await syncRecordValues(ids)).recordMap.notion_user!;

  return new Map(
    Object.values(data).map((
      { value: { id, name } },
    ) => [id, name]),
  );
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
}): Promise<CollectionRecord[]> {
  const data = (await queryCollection({
    collectionId,
    spaceId,
    userId,
    viewId: "",
  })).recordMap;

  const records: CollectionRecord[] = [];

  for (const block of Object.values(data.block)) {
    // Skip blocks that aren't part of the collection
    if (block.value.is_template || block.value.parent_table !== "collection") {
      continue;
    }

    const properties = {} as RecordProperties;

    // Process the properties of the current record
    for (const [id, value] of Object.entries(block.value.properties)) {
      // Skip deleted properties
      if (!Object.hasOwn(data.collection[collectionId].value.schema, id)) {
        continue;
      }

      // Get the property name and type from the schema provided in the response
      const { name, type } = data.collection[collectionId].value.schema[id];

      properties[id] = {
        name,
        type,
        value,
      } as RecordProperties[keyof RecordProperties];
    }

    records.push({
      id: block.value.id,
      icon: block.value.format.page_icon,
      properties,
    });
  }

  return records;
}
