import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import {
  BacklinksForBlock,
  CollectionQueryResult,
  datePropertySchema,
  RecordValuesSyncResult,
  textPropertySchema,
} from "./validators.ts";

export type _CollectionQueryResult = z.infer<typeof CollectionQueryResult>;
export type _RecordValuesSyncResult = z.infer<typeof RecordValuesSyncResult>;
export type _BacklinksForBlock = z.infer<typeof BacklinksForBlock>;
export type TextProperty = z.infer<typeof textPropertySchema>;
export type DateProperty = z.infer<typeof datePropertySchema>;

/** Maps property IDs to property names and values. */
export type RecordProperties = Record<
  string,
  & { name: string }
  & (
    | { type: "title" | "date" | "status"; value: string }
    | { type: "person"; value: string[] }
    | { type: "relation"; value: PagePointer[] }
  )
>;

export type CollectionRecord = {
  id: string;
  icon: string | undefined;
  properties: RecordProperties;
};

export type PagePointer = {
  pageId: string;
  spaceId: string;
};
