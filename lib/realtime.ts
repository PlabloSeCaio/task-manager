export function subscribeToProject(
  projectId: string,
  onTaskChange: () => void
) {
  let unsubscribed = false;

  const connect = async () => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const channel = supabase
        .channel(`project:${projectId}`)
        .on(
          "postgres_changes" as never,
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `project_id=eq.${projectId}`,
          } as never,
          () => {
            if (!unsubscribed) onTaskChange();
          }
        )
        .subscribe();

      return {
        unsubscribe: () => {
          unsubscribed = true;
          supabase.removeChannel(channel);
        },
      };
    } catch {
      return { unsubscribe: () => {} };
    }
  };

  const subscriptionPromise = connect();

  return {
    unsubscribe: () => {
      unsubscribed = true;
      subscriptionPromise.then((sub) => sub.unsubscribe());
    },
  };
}
