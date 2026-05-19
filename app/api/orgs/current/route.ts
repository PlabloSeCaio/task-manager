import { auth, clerkClient } from "@clerk/nextjs/server";
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

      // No mapping found for this org
      const [defaultWs] = await db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          clerkOrganizationId: workspaces.clerkOrganizationId,
        })
        .from(workspaces)
        .where(eq(workspaces.id, DEFAULT_WORKSPACE_ID));

      if (defaultWs && !defaultWs.clerkOrganizationId) {
        // Default workspace is unclaimed — link it to this org
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

      // Default already claimed by another org — create a dedicated workspace
      let orgName = "My Workspace";
      let orgSlug = orgId;
      try {
        const client = await clerkClient();
        const org = await client.organizations.getOrganization({ organizationId: orgId });
        orgName = org.name;
        orgSlug = org.slug || orgId;
      } catch {
        // fallback to generic values if Clerk API unavailable
      }

      const [newWs] = await db
        .insert(workspaces)
        .values({
          name: orgName,
          slug: orgSlug,
          clerkOrganizationId: orgId,
        })
        .returning({ id: workspaces.id, name: workspaces.name });

      return apiSuccess({
        workspaceId: newWs.id,
        workspaceName: newWs.name,
        orgId,
      });
    }

    // No org selected — fallback to default workspace
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
