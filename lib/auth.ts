import { clerkClient } from "@clerk/nextjs/server";

export async function getClerkUser(userId: string) {
  const client = await clerkClient();
  return client.users.getUser(userId);
}
