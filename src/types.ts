type NotionId = string;

type PartialProp = {
  id: string;
  name: string;
};

export type NotionProperty =
  & { name: string }
  & (
    | { type: "text"; value: string }
    | { type: "date"; value: Date }
    | { type: "people"; value: Map<NotionId, string> }
    | { type: "relation"; value: Set<NotionId> }
  );

/** Maps property IDs to property names and values. */
export type NotionPropertiesMap = Map<string, NotionProperty>;

export class NotionRecord {
  icon?: string;
  properties: NotionPropertiesMap = new Map();

  constructor(icon?: string) {
    this.icon = icon;
  }

  propType(id: string): NotionProperty["type"] | undefined {
    return this.properties.get(id)?.type;
  }

  setTextProp({ id, name, text }: PartialProp & { text: string }) {
    this.properties.set(id, {
      name,
      type: "text",
      value: text,
    });
  }

  textProp(id: string): string | undefined {
    const prop = this.properties.get(id);

    if (prop === undefined || prop.type !== "text") return undefined;

    return prop.value;
  }

  setDateProp({ id, name, date }: PartialProp & { date: Date }) {
    this.properties.set(id, {
      name,
      type: "date",
      value: date,
    });
  }

  dateProp(id: string): Date | undefined {
    const prop = this.properties.get(id);

    if (prop === undefined || prop.type !== "date") return undefined;

    return prop.value;
  }

  setPeopleProp({ id, name, people }: PartialProp & { people: NotionUser[] }) {
    this.properties.set(id, {
      name,
      type: "people",
      value: new Map(people.map((p) => [p.id, p.name])),
    });
  }

  peopleProp(id: string): Map<NotionId, string> | undefined {
    const prop = this.properties.get(id);

    if (prop === undefined || prop.type !== "people") return undefined;

    return prop.value;
  }

  setRelationProp(
    { id, name, relations }: PartialProp & { relations: NotionId[] },
  ) {
    this.properties.set(id, {
      name,
      type: "relation",
      value: new Set(relations),
    });
  }

  relationProp(id: string): Set<NotionId> | undefined {
    const prop = this.properties.get(id);

    if (prop === undefined || prop.type !== "relation") return undefined;

    return prop.value;
  }
}

export type NotionCollection = Map<string, NotionRecord>;

export type NotionRecordDiff = {
  oldRecord: NotionRecord;
  newRecord: NotionRecord;
};

export type PagePointer = {
  pageId: string;
  spaceId: string;
};

export type NotionUser = {
  id: NotionId;
  name: string;
};

export type NotifierConfig =
  & { notionDatabaseId: NotionId }
  & ({
    trigger: "created" | "deleted";
    message: (record: NotionRecord) => string;
  } | {
    trigger: "propertyModified";
    modifiedPropertyId: string;
    message: (record: NotionRecordDiff) => string;
  });
