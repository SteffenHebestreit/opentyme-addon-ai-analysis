/**
 * AI Expense Analysis Plugin for OpenTYME
 *
 * Provides AI-powered features:
 * - PDF receipt text extraction via MCP server
 * - Automatic expense data extraction from receipts
 * - German tax law (AfA) depreciation analysis
 * - Tax deductibility percentage calculation
 *
 * @author OpenTYME Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import type { AddonPlugin, PluginContext } from '../types';
import { ExpenseExtractionService, ExtractedExpenseData } from './expense-extraction.service';
import { AIDepreciationService, DepreciationAnalysis, ExpenseForAnalysis } from './ai-depreciation.service';
import { MCPClientService } from './mcp-client.service';

const router = Router();

const plugin: AddonPlugin = {
  name: 'ai-expense-analysis',

  async initialize(context: PluginContext): Promise<void> {
    const { database: db, logger, ai } = context;

    // Tell the LLM what this addon's tools do
    ai.registerSystemPromptExtension(
      'ai-expense-analysis',
      'You have tools for AI-powered expense analysis: analyze PDF receipts to extract expense data (ai_expense_analysis_analyze_receipt), analyze expenses for German tax law AfA depreciation eligibility (ai_expense_analysis_analyze_depreciation), and clear stored AI analysis (ai_expense_analysis_clear_analysis). Use these when asked about receipt scanning, tax depreciation (AfA), or expense AI analysis.'
    );

    /**
     * @swagger
     * /plugins/ai-expense-analysis/analyze-receipt:
     *   post:
     *     operationId: ai_expense_analysis_analyze_receipt
     *     summary: Extract expense data from a PDF receipt using AI
     *     description: Uploads a base64-encoded PDF receipt and uses AI to extract expense details such as amount, vendor, date, and category.
     *     tags: [AI Expense Analysis]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [receiptBuffer, filename]
     *             properties:
     *               receiptBuffer:
     *                 type: string
     *                 description: Base64-encoded PDF content
     *               filename:
     *                 type: string
     *                 description: Original filename of the receipt
     *     responses:
     *       200:
     *         description: Extracted expense data
     */
    router.post('/analyze-receipt', async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const { receiptBuffer, filename } = req.body;

        if (!receiptBuffer || !filename) {
          return res.status(400).json({ error: 'Missing receipt data or filename' });
        }

        logger.info(`[AI Analysis] Receipt extraction requested for: ${filename}`);

        const extractionService = new ExpenseExtractionService();
        await extractionService.initialize(userId);

        const buffer = Buffer.from(receiptBuffer, 'base64');
        const pdfText = await extractionService.extractPDFText(buffer, filename);
        const extractedData: ExtractedExpenseData = await extractionService.extractExpenseData(pdfText);

        logger.info(`[AI Analysis] Successfully extracted data from ${filename}`);

        return res.json({ success: true, data: extractedData });
      } catch (error: any) {
        logger.error('[AI Analysis] Receipt extraction failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to extract receipt data',
          message: error.message,
        });
      }
    });

    /**
     * @swagger
     * /plugins/ai-expense-analysis/analyze-depreciation:
     *   post:
     *     operationId: ai_expense_analysis_analyze_depreciation
     *     summary: Analyze an expense for German AfA depreciation eligibility
     *     description: Uses AI to determine whether an expense qualifies for AfA (Absetzung für Abnutzung) depreciation under German tax law, and calculates the annual depreciation amount and useful life.
     *     tags: [AI Expense Analysis]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [expense]
     *             properties:
     *               expense:
     *                 type: object
     *                 description: Expense data to analyze
     *                 properties:
     *                   id:
     *                     type: string
     *                     format: uuid
     *                   description:
     *                     type: string
     *                   amount:
     *                     type: number
     *                   category:
     *                     type: string
     *                   expense_date:
     *                     type: string
     *                     format: date
     *     responses:
     *       200:
     *         description: Depreciation analysis result
     */
    router.post('/analyze-depreciation', async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const expense: ExpenseForAnalysis = req.body.expense;

        if (!expense || !expense.id) {
          return res.status(400).json({ error: 'Missing or invalid expense data' });
        }

        logger.info(`[AI Analysis] Depreciation analysis requested for expense: ${expense.id}`);

        const depreciationService = new AIDepreciationService();
        await depreciationService.initialize(userId);

        const analysis: DepreciationAnalysis = await depreciationService.analyzeExpense(expense);

        logger.info(`[AI Analysis] Depreciation analysis complete for ${expense.id}: ${analysis.recommendation}`);

        await db.query(
          `UPDATE expenses
           SET ai_analysis = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND user_id = $3`,
          [JSON.stringify(analysis), expense.id, userId]
        );

        return res.json({ success: true, analysis });
      } catch (error: any) {
        logger.error('[AI Analysis] Depreciation analysis failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to analyze depreciation',
          message: error.message,
        });
      }
    });

    /**
     * @swagger
     * /plugins/ai-expense-analysis/clear-analysis/{expenseId}:
     *   post:
     *     operationId: ai_expense_analysis_clear_analysis
     *     summary: Clear stored AI analysis for an expense
     *     description: Removes the AI-generated analysis data from a specific expense record.
     *     tags: [AI Expense Analysis]
     *     parameters:
     *       - in: path
     *         name: expenseId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID of the expense to clear analysis for
     *     responses:
     *       200:
     *         description: Analysis cleared successfully
     */
    router.post('/clear-analysis/:expenseId', async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const { expenseId } = req.params;

        logger.info(`[AI Analysis] Clearing analysis for expense: ${expenseId}`);

        await db.query(
          `UPDATE expenses
           SET ai_analysis = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND user_id = $2`,
          [expenseId, userId]
        );

        return res.json({ success: true, message: 'Analysis cleared successfully' });
      } catch (error: any) {
        logger.error('[AI Analysis] Failed to clear analysis:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to clear analysis',
          message: error.message,
        });
      }
    });

    /**
     * GET /api/plugins/ai-expense-analysis/health
     * Check if MCP server is available
     */
    router.get('/health', async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const settingsResult = await db.query(
          'SELECT mcp_server_url FROM settings WHERE user_id = $1',
          [userId]
        );

        const mcpServerUrl = settingsResult.rows[0]?.mcp_server_url || 'http://mcp-server:8000';
        const mcpClient = new MCPClientService(mcpServerUrl);
        const isHealthy = await mcpClient.healthCheck();

        return res.json({
          success: true,
          mcp_server: { url: mcpServerUrl, healthy: isHealthy },
        });
      } catch (error: any) {
        logger.error('[AI Analysis] Health check failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Health check failed',
          message: error.message,
        });
      }
    });

    logger.info('[AI Analysis Plugin] Initialized successfully');
  },

  routes: router,
};

export default plugin;
