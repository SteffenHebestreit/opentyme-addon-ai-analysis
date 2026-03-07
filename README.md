# OpenTYME AI Expense Analysis Addon

AI-powered expense analysis addon for OpenTYME with receipt extraction, depreciation calculation (AfA), and tax deductibility analysis.

## Features

### 🤖 Receipt Data Extraction
- Automatic PDF receipt text extraction via MCP server
- AI-powered data parsing (amount, vendor, date, tax, etc.)
- Support for multiple AI providers (local LLM, OpenAI, Azure, Anthropic)
- High accuracy with confidence scores

### 📊 Depreciation Analysis (AfA)
- German tax law compliant depreciation recommendations
- AfA table integration with 40+ asset categories
- IT equipment (1-year depreciation since 2021)
- Office furniture, vehicles, and equipment categories
- Web research integration for up-to-date tax regulations

### 💰 Tax Deductibility Calculation
- Percentage-based tax deductibility analysis
- Private vs. business use classification
- Reasoning and documentation for tax audits
- Support for mixed-use assets

### 🔌 Flexible AI Provider Support
- **Local LLMs**: LM Studio, Ollama, llama.cpp
- **Cloud**: OpenAI GPT-4, Azure OpenAI, Anthropic Claude
- **Custom**: Any OpenAI-compatible API

## Installation

### Option 1: Via addons.config.json (Recommended)

Add to your OpenTYME `addons.config.json`:

```json
{
  "addons": [
    {
      "name": "ai-expense-analysis",
      "source": "github",
      "repo": "opentyme/opentyme-addon-ai-analysis",
      "version": "v1.0.0"
    }
  ]
}
```

Then rebuild:
```bash
./scripts/install-addons.sh
docker-compose up --build
```

### Option 2: Manual Installation

```bash
# Clone the addon
git clone https://github.com/opentyme/opentyme-addon-ai-analysis.git

# Add to addons.config.json as local
{
  "addons": [
    {
      "name": "ai-expense-analysis",
      "source": "local",
      "path": "/absolute/path/to/opentyme-addon-ai-analysis"
    }
  ]
}

# Install
./scripts/install-addons.sh
docker-compose up --build
```

## Configuration

### 1. Set Up MCP Server (PDF Extraction)

The addon requires an MCP server for PDF text extraction. You can:

**Option A: Use OpenTYME's built-in MCP server**
```yaml
# Already configured in docker-compose.yml
services:
  mcp-server:
    image: opentyme/mcp-server:latest
    ports:
      - "8000:8000"
```

**Option B: Deploy your own**
```bash
git clone https://github.com/your-org/mcp-server.git
cd mcp-server
docker build -t mcp-server .
docker run -p 8000:8000 mcp-server
```

### 2. Configure AI Provider

Navigate to **Settings → AI Analysis** in OpenTYME:

#### For Local LLM (LM Studio)
1. Download [LM Studio](https://lmstudio.ai/)
2. Load a model (recommended: `Qwen/Qwen2.5-32B-Instruct`)
3. Start the server (default: `http://localhost:1234`)
4. In OpenTYME settings:
   - **AI Provider**: Local
   - **API URL**: `http://localhost:1234/v1`
   - **Model**: `qwen/qwen3-v1-30b` (or your loaded model)
   - **API Key**: Leave empty

#### For OpenAI
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. In OpenTYME settings:
   - **AI Provider**: OpenAI
   - **API URL**: `https://api.openai.com/v1`
   - **Model**: `gpt-4` or `gpt-4-turbo`
   - **API Key**: Your OpenAI API key

#### For Azure OpenAI
1. Set up Azure OpenAI resource
2. In OpenTYME settings:
   - **AI Provider**: Azure
   - **API URL**: `https://<your-resource>.openai.azure.com`
   - **Model**: Your deployment name
   - **API Key**: Your Azure API key

### 3. Analysis Preferences

- **Auto-Analyze Receipts**: Automatically analyze uploaded PDFs
- **Confidence Threshold**: Minimum AI confidence to accept suggestions (default: 70%)

## Usage

### Analyzing Expense Receipts

1. **Upload Receipt**
   - Go to Expenses → Add Expense
   - Upload a PDF receipt
   - If auto-analyze is enabled, extraction happens automatically

2. **Manual Analysis**
   - Click "Analyze with AI" button
   - Wait for AI processing (5-30 seconds)
   - Review extracted data

3. **Review Results**
   - Check confidence scores
   - Verify extracted amount, vendor, date
   - Accept or modify suggestions

### Depreciation Analysis

1. **Trigger Analysis**
   - Open an expense
   - Click "Analyze Depreciation" button
   - AI analyzes based on:
     - Expense description
     - Category
     - Amount
     - German tax law (AfA tables)

2. **Review Recommendation**
   - **None**: Immediate deduction (< €800 or consumables)
   - **Immediate**: GWG (€800-€1000)
   - **Partial**: Depreciation required (> €1000)

3. **Apply Settings**
   - Accept AI recommendation
   - Or manually adjust years/method
   - Save to expense

### Tax Deductibility

The AI automatically calculates:
- **100%**: Fully business-deductible
- **50%**: Mixed personal/business use
- **0%**: Private expense

Includes detailed reasoning for tax documentation.

## API Endpoints

### POST /api/plugins/ai-expense-analysis/analyze-receipt
Extract expense data from PDF receipt.

**Request:**
```json
{
  "receiptBuffer": "base64_encoded_pdf",
  "filename": "receipt.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 129.99,
    "currency": "EUR",
    "date": "2025-01-15",
    "vendor": "Tech Store GmbH",
    "category": "computer",
    "tax_amount": 20.72,
    "tax_rate": 19,
    "confidence": 0.95
  }
}
```

### POST /api/plugins/ai-expense-analysis/analyze-depreciation
Analyze depreciation eligibility.

**Request:**
```json
{
  "expense": {
    "id": "expense-id",
    "description": "MacBook Pro 16\"",
    "category": "computer",
    "amount": 2899.00,
    "net_amount": 2436.13,
    "expense_date": "2025-01-15"
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "recommendation": "partial",
    "reasoning": "Computer equipment over €1000 requires depreciation",
    "suggested_years": 1,
    "useful_life_category": "IT Equipment",
    "tax_deductible_percentage": 100,
    "gwg_applicable": false,
    "requires_depreciation": true,
    "confidence": 0.92
  }
}
```

### POST /api/plugins/ai-expense-analysis/clear-analysis/:expenseId
Clear AI analysis for an expense.

### GET /api/plugins/ai-expense-analysis/health
Check MCP server connectivity.

## Architecture

```
opentyme-addon-ai-analysis/
├── backend/
│   ├── src/
│   │   ├── index.ts                        # Plugin entry point
│   │   ├── expense-extraction.service.ts   # Receipt extraction
│   │   ├── ai-depreciation.service.ts      # AfA analysis
│   │   └── mcp-client.service.ts           # PDF text extraction
│   ├── types/                              # TypeScript types
│   └── utils/                              # Helper utilities
├── frontend/
│   ├── src/
│   │   └── index.tsx                       # Frontend plugin
│   ├── components/
│   │   ├── DepreciationAnalysisSection.tsx # AI analysis UI
│   │   └── AISettingsTab.tsx               # Settings page
│   └── hooks/                              # React hooks
├── addon-manifest.json                     # Plugin metadata
├── package.json                            # NPM package
└── README.md                               # This file
```

## Development

### Prerequisites
- Node.js >= 18.0.0
- OpenTYME instance (for testing)
- AI provider access (local LLM or API)

### Setup

```bash
# Install dependencies
npm install

# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm test
```

### Testing with OpenTYME

```bash
# In OpenTYME root directory
# Add to addons.config.json
{
  "addons": [
    {
      "name": "ai-expense-analysis",
      "source": "local",
      "path": "/path/to/opentyme-addon-ai-analysis"
    }
  ]
}

# Install and rebuild
./scripts/install-addons.sh
docker-compose up --build
```

## Supported Models

### Recommended Models

**Local (Free):**
- Qwen 2.5 32B Instruct (best quality)
- Llama 3.2 3B Instruct (fastest)
- Mistral 7B Instruct (balanced)

**Cloud (Paid):**
- GPT-4 Turbo (best overall)
- Claude 3 Opus (excellent reasoning)
- GPT-4 (reliable)

### Model Requirements
- **Minimum**: 3B parameters
- **Recommended**: 7B+ for better accuracy
- **Features**: Instruction following, JSON output

## Troubleshooting

### "AI service not enabled"
→ Enable AI in Settings → AI Analysis

### "MCP server not responding"
→ Check MCP server is running: `curl http://mcp-server:8000/api/health`

### "Failed to extract receipt data"
→ Ensure PDF is readable text (not scanned image)

### Low confidence scores
→ Try a larger/better model or adjust threshold

### "Model not found"
→ Check model name matches loaded model in LM Studio

## Performance

- **Receipt Extraction**: 10-30 seconds
- **Depreciation Analysis**: 15-45 seconds (includes web research)
- **Memory**: ~500MB (local model) to 2GB (large models)
- **API Costs**: ~$0.01-0.05 per analysis (cloud providers)

## Privacy & Security

- All analysis happens on your configured provider
- With local LLMs: 100% private, no data leaves your server
- With cloud APIs: Data sent to provider (check their privacy policy)
- Receipt PDFs are not stored permanently
- API keys encrypted in database

## License

MIT License - see [LICENSE](LICENSE)

## Support

- **Issues**: [GitHub Issues](https://github.com/opentyme/opentyme-addon-ai-analysis/issues)
- **Discussions**: [GitHub Discussions](https://github.com/opentyme/opentyme-addon-ai-analysis/discussions)
- **Documentation**: [docs.opentyme.dev](https://docs.opentyme.dev)

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## Changelog

### v1.0.0 (2025-02-03)
- Initial release
- PDF receipt extraction
- Depreciation analysis with AfA tables
- Tax deductibility calculation
- Multi-provider support (local, OpenAI, Azure, Anthropic)
- Web research integration
- Settings UI

---

Made with ❤️ for the OpenTYME community
