/**
 * Zod schemas to validate Notion API responses.
 *
 * These schemas only include the fields used by the script.
 * The full schemas are a mess. What a terrible API.
 */

import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { PagePointer } from "./types.ts";

/** Convenience wrapper for nested, single-element tuples. */
function tuple2<T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(
  values: T,
): z.ZodTuple<[z.ZodTuple<T>]> {
  return z.tuple([z.tuple(values)]);
}

export const textPropertySchema = tuple2([z.string()])
  .transform((val) => val[0][0]);

export const datePropertySchema = tuple2([
  z.literal("‣"),
  tuple2([
    z.literal("d"),
    z.object({
      type: z.literal("date"),
      start_date: z.string().date(),
    }),
  ]),
]).transform((val) => val[0][1][0][1].start_date);

export const usersPropertySchema = z.tuple([
  z.literal("‣"),
  tuple2([z.literal("u"), z.string()]),
]).or(z.tuple([z.literal(",")])) // This seems to be a separator between values
  .array().min(1).transform((val) =>
    val.reduce(
      (accum, v) => v[0] === "‣" ? [v[1][0][1], ...accum] : accum,
      [] as string[],
    )
  );

export const relationsPropertySchema = z.tuple([
  z.literal("‣"),
  tuple2([z.literal("p"), z.string(), z.string()]),
]).or(z.tuple([z.literal(",")])) // This seems to be a separator between values
  .array().min(1).transform((val) =>
    val.reduce(
      (accum, v) =>
        v[0] === "‣"
          ? [{ pageId: v[1][0][1], spaceId: v[1][0][2] }, ...accum]
          : accum,
      [] as PagePointer[],
    )
  );

/**
 * Expected response body from `notion.so/api/v3/queryCollection`, with block
 * property values transformed for ease of processing in later stages of the program.
 */
export const CollectionQueryResult = z.object({
  recordMap: z.object({
    block: z.record(z.object({
      value: z.object({
        id: z.string(),
        properties: z.record(z.union([
          textPropertySchema,
          datePropertySchema,
          usersPropertySchema,
          relationsPropertySchema,
        ])),
        format: z.object({ page_icon: z.string().optional() }),
        is_template: z.boolean().optional(),
        parent_table: z.enum(["collection", "block", "space"]),
        created_by_id: z.string(),
      }),
    })),
    collection: z.record(z.object({
      value: z.object({
        schema: z.record(z.object({
          name: z.string(),
          type: z.enum(["title", "date", "status", "person", "relation"]),
        })),
      }),
    })),
  }),
});

/** Expected response body from `notion.so/api/v3/syncRecordValues` */
export const RecordValuesSyncResult = z.object({
  recordMap: z.object({
    notion_user: z.record(z.object({
      value: z.object({
        id: z.string(),
        name: z.string(),
      }),
    })).optional(),
  }),
});

/** Expected response body from `notion.so/api/v3/getBacklinksForBlock` */
export const BacklinksForBlock = z.object({
  recordMap: z.object({
    block: z.record(z.object({
      value: z.object({
        collection_id: z.string().optional(),
        space_id: z.string(),
        view_ids: z.string().array().optional(),
      }),
    })),
  }),
});
