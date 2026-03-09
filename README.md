# OpenTYME AI Expense Analysis Addon

AI-powered expense analysis addon for [OpenTYME](https://github.com/SteffenHebestreit/opentyme).

- **Receipt extraction** — parse PDF receipts into structured expense data via an AI model
- **AfA depreciation analysis** — determines German tax law depreciation eligibility (AfA tables, GWG, useful life)
- **AI assistant integration** — automatically registers as tools in the OpenTYME AI chat assistant

## Installation

Add to your OpenTYME `addons.config.json`:

```json
{
  "addons": [
    {
      "name": "ai-expense-analysis",
      "enabled": true,
      "source": {
        "type": "github",
        "repo": "SteffenHebestreit/opentyme-addon-ai-analysis",
        "ref": "main"
      }
    }
  ]
}
```

Then rebuild:

```bash
./scripts/install-addons.sh
docker compose up --build
```

For local development use `"type": "local"` with a `"path"` instead.

## Configuration

The addon uses the same AI provider configured in **Settings → AI**. No separate configuration needed.

For receipt extraction via MCP server, set `mcp_server_url` in your OpenTYME settings (default: `http://mcp-server:8000`).

## API Endpoints

All routes are mounted at `/api/plugins/ai-expense-analysis/` and require authentication.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/analyze-receipt` | Extract expense data from a base64-encoded PDF receipt |
| `POST` | `/analyze-depreciation` | Analyze an expense for AfA depreciation eligibility |
| `POST` | `/clear-analysis/:expenseId` | Remove stored AI analysis from an expense |
| `GET`  | `/health` | Check MCP server connectivity |

## AI Assistant Integration

When the OpenTYME AI assistant is enabled, this addon's endpoints are automatically exposed as LLM tools (`ai_expense_analysis_analyze_receipt`, `ai_expense_analysis_analyze_depreciation`, `ai_expense_analysis_clear_analysis`). The assistant is also told about these capabilities via a system prompt extension.

## Structure

```
opentyme-addon-ai-analysis/
├── addon-manifest.json
├── backend/
│   ├── src/
│   │   ├── index.ts                       # Plugin entry point
│   │   ├── expense-extraction.service.ts  # Receipt parsing
│   │   ├── ai-depreciation.service.ts     # AfA analysis
│   │   └── mcp-client.service.ts          # PDF text extraction
│   └── types/index.ts                     # PluginContext types
└── frontend/
    └── components/
        ├── DepreciationAnalysisSection.tsx
        └── AISettingsTab.tsx
```

## Changelog

### v1.1.0
- AI assistant integration: `@swagger` JSDoc on all routes, system prompt extension
- Fix `DepreciationAnalysisSection` Button import path

### v1.0.0
- Initial release: receipt extraction, AfA depreciation analysis, settings UI
