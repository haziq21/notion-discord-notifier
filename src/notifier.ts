import { getNotionUsername } from "./db.ts";
import {
  CollectionRecord,
  CollectionRecordsMap,
  NotificationMessage,
  NotifierConfig,
  PagePointer,
  RecordProperty,
} from "./types.ts";

/**
 * Return the records that are present in the new collection but not in the old collection.
 */
export function findCreatedNotionRecords(
  oldCollection: CollectionRecordsMap,
  newCollection: CollectionRecordsMap,
): CollectionRecord[] {
  const newRecordsId = new Set(newCollection.keys())
    .difference(new Set(oldCollection.keys()));

  return Array.from(newRecordsId)
    .map((recordId) => newCollection.get(recordId)!);
}

/**
 * Return the records where the property with the given ID was modified.
 */
export function findNotionRecordsWithModifiedProperty(
  oldCollection: CollectionRecordsMap,
  newCollection: CollectionRecordsMap,
  propertyId: string,
): { new: CollectionRecord; old: CollectionRecord }[] {
  // Only look at the records present in both collections (i.e. not created or deleted).
  const recordIds = new Set(oldCollection.keys())
    .intersection(new Set(newCollection.keys()));

  const recordsWithModifiedProperty: {
    new: CollectionRecord;
    old: CollectionRecord;
  }[] = [];

  for (const recordId of recordIds) {
    const oldRecord = oldCollection.get(recordId)!;
    const oldProperties = oldRecord.properties;
    const oldValue = oldProperties.get(propertyId)?.value;

    const newRecord = newCollection.get(recordId)!;
    const newProperties = newRecord.properties;
    const newValue = newProperties.get(propertyId)?.value;

    // Skip if the property isn't present in both the old and new records
    if (oldValue === undefined && newValue === undefined) {
      continue;
    }

    // Assume that the property type won't change between the old and new record
    const propertyType = (newProperties.get(propertyId)?.type ||
      oldProperties.get(propertyId)?.type) as string;

    let propertyWasModified: boolean;

    // TODO: Make this better
    if (oldValue === undefined || newValue === undefined) {
      propertyWasModified = true;
    } else if (["title", "status", "date"].includes(propertyType)) {
      propertyWasModified = oldValue !== newValue;
    } else if (propertyType === "person") {
      const newPeople = new Set(newValue as string[]);

      propertyWasModified =
        (<string[]> oldValue).length !== (<string[]> newValue).length ||
        !(<string[]> oldValue).every((person) => newPeople.has(person));
    } else {
      propertyWasModified = (newValue as PagePointer[])
        .every(({ pageId, spaceId }, i) =>
          (pageId === (oldValue as PagePointer[])[i].pageId) &&
          (spaceId === (oldValue as PagePointer[])[i].spaceId)
        );
    }

    if (propertyWasModified) {
      recordsWithModifiedProperty.push({ old: oldRecord, new: newRecord });
    }
  }

  return recordsWithModifiedProperty;
}

/**
 * Return the records that are present in the old collection but not in the new collection.
 */
export function findDeletedNotionRecords(
  oldCollection: CollectionRecordsMap,
  newCollection: CollectionRecordsMap,
): CollectionRecord[] {
  const oldRecordIds = new Set(oldCollection.keys())
    .difference(new Set(newCollection.keys()));

  return Array.from(oldRecordIds)
    .map((recordId) => oldCollection.get(recordId)!);
}

export async function constructMessage(
  { message, oldRecord, newRecord }: {
    message: NotificationMessage;
    oldRecord?: CollectionRecord;
    newRecord?: CollectionRecord;
  },
): Promise<string> {
  let msgString = "";

  for (const part of message) {
    if (part.type === "text") {
      msgString += part.value;
    } else if (part.type === "property") {
      const record = part.fromRecord === "old" ? oldRecord : newRecord;

      if (record === undefined) {
        msgString += "undefined";
      } else {
        const property = record.properties.get(part.propertyId);

        msgString += property
          ? await constructPropertyMessageComponent(property)
          : "undefined";
      }
    }
  }
  return msgString;
}

async function constructPropertyMessageComponent(
  property: RecordProperty,
): Promise<string> {
  if (
    property.type === "title" ||
    property.type === "status" ||
    property.type === "date"
  ) {
    return property.value;
  } else if (property.type === "person") {
    return (await Promise.all(
      property.value
        .map(async (notionUserId) => await getNotionUsername(notionUserId)),
    )).join(", ");
  } else {
    throw new Error("Not implemented");
  }
}

/** Pass-through function for type-checking purposes. */
export function configureNotifiers(
  notifiers: NotifierConfig[],
): NotifierConfig[] {
  return notifiers;
}
