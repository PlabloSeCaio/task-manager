import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiError, apiSuccess } from "@/lib/api-helpers";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  try {
    const session = await auth();
    if (!session.userId) return apiError("Unauthorized", 401);

    const orgId = session.orgId;

    // If user has an active Clerk org, try to find a mapped workspace
    if (orgId) {
      const [ws] = await db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          logoUrl: workspaces.logoUrl,
          clerkOrganizationId: workspaces.clerkOrganizationId,
        })
        .from(workspaces)
        .where(eq(workspaces.clerkOrganizationId, orgId));

      if (ws) {
        return apiSuccess({
          workspaceId: ws.id,
          workspaceName: ws.name,
          orgId,
        });
      }

      // Auto-link: if org exists but no mapping yet, link the default workspace
      const [defaultWs] = await db
        .select({ id: workspaces.id, name: workspaces.name })
        .from(workspaces)
        .where(eq(workspaces.id, DEFAULT_WORKSPACE_ID));

      if (defaultWs) {
        await db
          .update(workspaces)
          .set({ clerkOrganizationId: orgId })
          .where(eq(workspaces.id, DEFAULT_WORKSPACE_ID));

        return apiSuccess({
          workspaceId: DEFAULT_WORKSPACE_ID,
          workspaceName: defaultWs.name || "My Workspace",
          orgId,
        });
      }
    }

    // Fallback: no org selected — use default
    const [defaultWs] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        logoUrl: workspaces.logoUrl,
        clerkOrganizationId: workspaces.clerkOrganizationId,
      })
      .from(workspaces)
      .where(eq(workspaces.id, DEFAULT_WORKSPACE_ID));

    return apiSuccess({
      workspaceId: defaultWs?.id || DEFAULT_WORKSPACE_ID,
      workspaceName: defaultWs?.name || "My Workspace",
      orgId: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
