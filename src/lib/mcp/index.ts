import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listMyAdsTool from "./tools/list_my_ads";

// The OAuth issuer MUST be the direct Supabase host. Read the project ref
// via import.meta.env.VITE_SUPABASE_PROJECT_ID (inlined by Vite at build time).
const projectRef =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) ??
  "project-ref-unset";

export default defineMcp({
  name: "trelink-mcp",
  title: "TreLink",
  version: "0.1.0",
  instructions:
    "MCP-server för TreLink — den digitala mäklaren för överlåtelse, inkråm och aktieöverlåtelse. Använd `whoami` för att verifiera inloggning och `list_my_ads` för att lista säljarens annonser.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listMyAdsTool],
});
