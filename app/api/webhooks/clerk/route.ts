import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  const wh = new Webhook(webhookSecret);
  let event: { type: string; data: Record<string, unknown> };

  try {
    event = wh.verify(payload, headers) as typeof event;
  } catch {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;

      const name = [first_name, last_name].filter(Boolean).join(" ") || "User";
      const email =
        (email_addresses as Array<{ email_address: string }>)?.[0]
          ?.email_address || `${id}@placeholder.dev`;

      await db
        .insert(users)
        .values({
          externalId: id as string,
          email,
          name,
          avatarUrl: (image_url as string) || null,
        })
        .onConflictDoNothing();

      break;
    }

    case "user.updated": {
      const { id, first_name, last_name, image_url } = event.data;
      const name = [first_name, last_name].filter(Boolean).join(" ") || "User";

      await db
        .update(users)
        .set({
          name,
          avatarUrl: (image_url as string) || null,
        })
        .where(eq(users.externalId, id as string));

      break;
    }

    case "user.deleted": {
      const { id } = event.data;
      await db
        .delete(users)
        .where(eq(users.externalId, id as string));
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
