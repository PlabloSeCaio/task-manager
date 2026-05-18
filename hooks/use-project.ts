"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project, Section } from "@/types";

export function useProject(projectId?: string) {
  const queryClient = useQueryClient();

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();
      if (!json.data) throw new Error(json.error || "Failed to fetch project");
      return json.data as Project;
    },
    enabled: !!projectId,
  });

  const sections = useQuery({
    queryKey: ["sections", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`/api/projects/${projectId}/sections`);
      const json = await res.json();
      if (!json.data) throw new Error(json.error || "Failed to fetch sections");
      return json.data as Section[];
    },
    enabled: !!projectId,
  });

  const createSection = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/projects/${projectId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.data) throw new Error(json.error || "Failed to create section");
      return json.data as Section;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections", projectId] });
    },
  });

  const updateProject = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.data) throw new Error(json.error || "Failed to update project");
      return json.data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  return { project, sections, createSection, updateProject };
}
