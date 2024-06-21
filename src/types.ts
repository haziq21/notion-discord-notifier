export type NotionId = string;

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
export type SerializedNotionRecord = {
  id: NotionId;
  url: string;
  icon?: string;
  properties: NotionPropertiesMap;
};

export class NotionRecord {
  id: NotionId;
  url: string;
  icon?: string;
  properties: NotionPropertiesMap = new Map();

  constructor(
    { id, url, icon, properties }: {
      id: NotionId;
      url: string;
      icon?: string;
      properties?: NotionPropertiesMap;
    },
  ) {
    this.id = id;
    this.url = url;
    this.icon = icon;

    if (properties !== undefined) {
      this.properties = properties;
    }
  }

  // Deno KV can't store class instances
  serialize(): SerializedNotionRecord {
    return {
      id: this.id,
      url: this.url,
      icon: this.icon,
      properties: this.properties,
    };
  }

  /** Title of the record with the emoji icon (if it has one). */
  get displayName(): string {
    return this.icon !== undefined
      ? `${this.icon} ${this.textProp("title")!}`
      : this.textProp("title")!;
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
export type SerializedNotionCollection = Map<string, SerializedNotionRecord>;

export type NotionRecordDiff = {
  oldRecord: NotionRecord;
  newRecord: NotionRecord;
};

export type NotionUser = {
  id: NotionId;
  name: string;
};

// TODO: This can probably be refactored
export type NotifierConfig =
  & { notionDatabaseId: NotionId; updateWindow?: number }
  & ({
    trigger: "created" | "deleted";
    message: (record: NotionRecord) => string;
  } | {
    trigger: "propertyModified";
    modifiedPropertyId: string;
    message: (record: NotionRecordDiff) => string;
  });

export type NotificationUpdateEvent = {
  notifierConfigHash: string;
  notifInitiallySentTime: number;
  serialisedOldRecord: SerializedNotionRecord;
  notionRecordId: NotionId;
  discordMessageId: string;
};
