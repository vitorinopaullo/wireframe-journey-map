import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "list_my_ads",
  title: "Lista mina annonser",
  description:
    "Listar annonser som den inloggade säljaren skickat in till TreLink. OBS: I denna prototyp lagras annonser i webbläsarens localStorage och är inte tillgängliga via MCP — verktyget returnerar en förklarande status och användarens ID.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ej inloggad" }], isError: true };
    }
    const payload = {
      userId: ctx.getUserId(),
      email: ctx.getUserEmail(),
      status: "prototype_localstorage",
      note:
        "TreLink är en wireframe-prototyp. Annonser lagras just nu i webbläsarens localStorage och exponeras inte via MCP. När annonser flyttas till Lovable Cloud kommer detta verktyg att returnera de riktiga raderna för inloggad säljare.",
      ads: [] as Array<Record<string, unknown>>,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
