-- Seed the default workspace (required for app to function)
INSERT INTO workspaces (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000000', 'My Workspace', 'my-workspace')
ON CONFLICT (id) DO NOTHING;
