import {
  NotifierConfig,
  NotionCollection,
  NotionRecord,
  NotionRecordDiff,
} from "./types.ts";

/**
 * Return the records that are present in the new collection but not in the old collection.
 */
export function findCreatedNotionRecords(
  oldCollection: NotionCollection,
  newCollection: NotionCollection,
): NotionRecord[] {
  const newRecordsId = new Set(newCollection.keys())
    .difference(new Set(oldCollection.keys()));

  return Array.from(newRecordsId)
    .map((recordId) => newCollection.get(recordId)!);
}

/**
 * Return the records where the property with the given ID was modified.
 */
export function findNotionRecordsWithModifiedProperty(
  oldCollection: NotionCollection,
  newCollection: NotionCollection,
  propertyId: string,
): NotionRecordDiff[] {
  // Only look at the records present in both collections (i.e. not created or deleted).
  const recordIds = new Set(oldCollection.keys())
    .intersection(new Set(newCollection.keys()));

  const recordsWithModifiedProperty: NotionRecordDiff[] = [];

  for (const recordId of recordIds) {
    const oldRecord = oldCollection.get(recordId)!;
    const newRecord = newCollection.get(recordId)!;

    if (propertyWasModified(oldRecord, newRecord, propertyId)) {
      recordsWithModifiedProperty.push({ oldRecord, newRecord });
    }
  }

  return recordsWithModifiedProperty;
}

function propertyWasModified(
  oldRecord: NotionRecord,
  newRecord: NotionRecord,
  propertyId: string,
): boolean {
  const oldType = oldRecord.propType(propertyId);
  const newType = newRecord.propType(propertyId);

  // Nothing changed if the property was always unset
  if (oldType === undefined && newType === undefined) return false;

  // The property changed if it was added or removed
  if (oldType === undefined || newType === undefined) return true;

  // The property changed if its type changed
  if (oldType !== newType) return true;

  if (oldType === "text") {
    return newRecord.textProp(propertyId) !== oldRecord.textProp(propertyId);
  }

  if (oldType === "people") {
    const oldPeople = oldRecord.peopleProp(propertyId)!;
    const newPeople = newRecord.peopleProp(propertyId)!;

    return oldPeople.size !== newPeople.size ||
      !Array.from(oldPeople.keys()).every((id) => newPeople.has(id));
  }

  if (oldType === "relation") {
    const oldPageIds = oldRecord.relationProp(propertyId)!;
    const newPageIds = newRecord.relationProp(propertyId)!;

    return oldPageIds.size !== newPageIds.size ||
      !Array.from(oldPageIds).every((id) => newPageIds.has(id));
  }

  throw new Error("Something's not very right");
}

/**
 * Return the records that are present in the old collection but not in the new collection.
 */
export function findDeletedNotionRecords(
  oldCollection: NotionCollection,
  newCollection: NotionCollection,
): NotionRecord[] {
  const oldRecordIds = new Set(oldCollection.keys())
    .difference(new Set(newCollection.keys()));

  return Array.from(oldRecordIds)
    .map((recordId) => oldCollection.get(recordId)!);
}

/** Pass-through function for type-checking purposes. */
export function configureNotifiers(
  notifiers: NotifierConfig[],
): NotifierConfig[] {
  return notifiers;
}
