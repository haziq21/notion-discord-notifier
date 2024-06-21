import { configureNotifiers } from "./notifier.ts";
import { NotionRecord, NotionRecordDiff } from "./types.ts";

function stringifyPeople(people: Map<string, string>): string {
  const peopleArray = Array.from(people.values());

  if (peopleArray.length === 1) {
    return peopleArray[0];
  }

  return peopleArray.slice(0, -1).map((name) => `${name}`).join(", ") +
    ` & ${peopleArray.at(-1)}`;
}

export default configureNotifiers([
  {
    notionDatabaseId: "0e197ea2e5a54a45b2f9ca04c3adedff",
    trigger: "propertyModified",
    modifiedPropertyId: "notion%3A%2F%2Ftasks%2Fstatus_property",
    message({ oldRecord, newRecord }: NotionRecordDiff) {
      const taskName = newRecord.textProp("title")!;
      const oldStatus = oldRecord.textProp(
        "notion%3A%2F%2Ftasks%2Fstatus_property",
      )!;
      const newStatus = newRecord.textProp(
        "notion%3A%2F%2Ftasks%2Fstatus_property",
      )!;
      const assignees = newRecord.peopleProp(
        "notion%3A%2F%2Ftasks%2Fassign_property",
      );

      const baseMessage =
        `[${taskName}](${newRecord.url}) updated: *${oldStatus}* → *${newStatus}*` +
        (newStatus === "Done" ? " 🎉" : "");

      if (assignees === undefined) {
        return baseMessage;
      }

      const assigneesText = stringifyPeople(assignees);

      return `${baseMessage}\n(assigned to ${assigneesText})`;
    },
  },
  {
    notionDatabaseId: "0e197ea2e5a54a45b2f9ca04c3adedff",
    trigger: "created",
    updateWindow: 120,
    message(record: NotionRecord) {
      const createdBy = stringifyPeople(record.peopleProp("m%5C_C")!);
      const taskName = record.textProp("title")!;
      const status = record.textProp(
        "notion%3A%2F%2Ftasks%2Fstatus_property",
      )!;
      const assignees = record.peopleProp(
        "notion%3A%2F%2Ftasks%2Fassign_property",
      );

      const baseMessage =
        `${createdBy} created task [${taskName}](${record.url}) (*${status}*)`;

      if (assignees === undefined) {
        return baseMessage;
      }

      const assigneesText = stringifyPeople(assignees);

      return `${baseMessage}\n(assigned to ${assigneesText})`;
    },
  },
]);
