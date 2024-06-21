import { configureNotifiers } from "./notifier.ts";
import { NotionRecord, NotionRecordDiff } from "./types.ts";

function stringifyPeople(people: Map<string, string>): string {
  return Array.from(people.values()).map((name) => `**${name}**`).join(", ");
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
        `**${taskName}** moved from *${oldStatus}* to *${newStatus}*`;
      if (assignees === undefined) {
        return baseMessage;
      }

      const assigneesText = stringifyPeople(assignees);

      return `${baseMessage}\nAssignee(s): ${assigneesText}`;
    },
  },
  {
    notionDatabaseId: "0e197ea2e5a54a45b2f9ca04c3adedff",
    trigger: "created",
    message(record: NotionRecord) {
      const createdBy = stringifyPeople(record.peopleProp("m%5C_C")!);
      const taskName = record.textProp("title")!;
      const taskDisplayName = record.icon
        ? `${record.icon} ${taskName}`
        : taskName;
      const status = record.textProp(
        "notion%3A%2F%2Ftasks%2Fstatus_property",
      )!;
      const assignees = record.peopleProp(
        "notion%3A%2F%2Ftasks%2Fassign_property",
      );

      const baseMessage =
        `**${createdBy}** created task **${taskDisplayName}** (*${status}*)`;

      if (assignees === undefined) {
        return baseMessage;
      }

      const assigneesText = stringifyPeople(assignees);

      return `${baseMessage}\nAssignee(s): ${assigneesText}`;
    },
  },
]);
