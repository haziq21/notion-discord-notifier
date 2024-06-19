import { Client } from "npm:@notionhq/client";

const notion = new Client({
    auth: Deno.env.get("NOTION_SECRET"),
});

console.log(
    await notion.users.retrieve({
        user_id: "",
    }),
);
