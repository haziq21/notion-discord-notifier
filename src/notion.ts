/**
 * Functions to call Notion APIs and validate their responses with Zod.
 */

import {
  _BacklinksForBlock,
  _CollectionQueryResult,
  _RecordValuesSyncResult,
} from "./types.ts";
import {
  BacklinksForBlock,
  CollectionQueryResult,
  RecordValuesSyncResult,
} from "./validators.ts";

export async function syncRecordValues(
  user_ids: string[],
): Promise<_RecordValuesSyncResult> {
  const res = await fetch("https://www.notion.so/api/v3/syncRecordValues", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": Deno.env.get("COOKIE")!,
    },
    body: JSON.stringify({
      requests: user_ids.map((id) => ({
        pointer: { table: "notion_user", id },
        version: -1,
      })),
    }),
  });

  return RecordValuesSyncResult.parse(await res.json());
}

export async function getBacklinksForBlock(
  blockId: string,
): Promise<_BacklinksForBlock> {
  const res = await fetch("https://www.notion.so/api/v3/getBacklinksForBlock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": Deno.env.get("COOKIE")!,
    },
    body: JSON.stringify({ block: { id: blockId } }),
  });

  return BacklinksForBlock.parse(await res.json());
}

export async function queryCollection(
  { collectionId, spaceId, viewId = "", userId }: {
    collectionId: string;
    spaceId: string;
    viewId: string;
    userId: string;
  },
): Promise<_CollectionQueryResult> {
  const res = await fetch("https://www.notion.so/api/v3/queryCollection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": Deno.env.get("COOKIE")!,
    },
    body: JSON.stringify({
      source: {
        type: "collection",
        id: collectionId,
        spaceId,
      },

      // The request doesn't work without collectionView, but its values seem to be ignored
      collectionView: {
        id: viewId,
        spaceId,
      },

      loader: {
        reducers: {
          collection_group_results: {
            type: "results",
            limit: 5,
          },
        },
        sort: [],
        searchQuery: "",
        userId,
        userTimeZone: "Asia/Singapore",
      },
    }),
  });

  return CollectionQueryResult.parse(await res.json());
}
