import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import {
  BacklinksForBlock,
  CollectionQueryResult,
  RecordValuesSyncResult,
} from "./validators.ts";

export type _CollectionQueryResult = z.infer<typeof CollectionQueryResult>;
export type _RecordValuesSyncResult = z.infer<typeof RecordValuesSyncResult>;
export type _BacklinksForBlock = z.infer<typeof BacklinksForBlock>;

export type RecordProperty =
  & { name: string }
  & (
    | { type: "title" | "date" | "status"; value: string }
    | { type: "person"; value: string[] }
    | { type: "relation"; value: PagePointer[] }
  );

/** Maps property IDs to property names and values. */
export type RecordPropertiesMap = Map<string, RecordProperty>;

export type CollectionRecord = {
  icon?: string;
  properties: RecordPropertiesMap;
};

export type CollectionRecordsMap = Map<string, CollectionRecord>;

export type CollectionRecordsDiff = Map<
  string,
  { old?: CollectionRecord; new?: CollectionRecord }
>;

export type PagePointer = {
  pageId: string;
  spaceId: string;
};

export type NotificationMessage = (
  | { type: "text"; value: string }
  | { type: "property"; fromRecord: "old" | "new"; propertyId: string }
)[];

export type NotifierCondition =
  | { change: "created" | "deleted" }
  | { change: "propertyModified"; propertyId: string };

export type NotifierConditionSet = {
  condition: NotifierCondition;
  message: NotificationMessage;
}[];

export type NotifierConfig = {
  notionBlock: string;
  discordWebhook: string;
  notionCookie: string;
  notifierConditionSet: NotifierConditionSet;
  notifierId: string;
};
