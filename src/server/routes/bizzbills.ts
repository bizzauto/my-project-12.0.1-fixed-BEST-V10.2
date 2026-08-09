import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const BIZZBILLS_BASE_URL = process.env.BIZZBILLS_BASE_URL || 'https://invoice.bizzautoai.com';

/**
 * GET /api/bizzbills/status
 * Check BizzBills integration status (connection + app health)
 */
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const integration = await prisma.integration.findUnique({
      where: { businessId_type: { businessId, type: 'bizzbills' } },
    });

    // Live health check against BizzBills app
    let appOnline = false;
    let appError: string | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const healthRes = await fetch(`${BIZZBILLS_BASE_URL}/api/health`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);
      appOnline = healthRes.status < 500;
    } catch (err: any) {
      appError = err.message;
    }

    return res.json({
      success: true,
      data: {
        baseUrl: BIZZBILLS_BASE_URL,
        appOnline,
        appError,
        connected: integration?.isActive || false,
        connectedEmail: (integration?.config as any)?.email || null,
        lastSyncAt: integration?.lastSyncAt || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bizzbills/connect
 * Test BizzBills credentials and save integration
 */
router.post('/connect', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    // Test credentials against BizzBills demo-login API
    let loginRes;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      loginRes = await fetch(`${BIZZBILLS_BASE_URL}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err: any) {
      return res.status(502).json({ success: false, error: `Cannot reach BizzBills: ${err.message}` });
    }

    const body = await loginRes.json().catch(() => ({}));

    if (!loginRes.ok) {
      return res.status(401).json({
        success: false,
        error: body.error || `BizzBills login failed (HTTP ${loginRes.status})`,
      });
    }

    const integration = await prisma.integration.upsert({
      where: { businessId_type: { businessId, type: 'bizzbills' } },
      create: {
        businessId,
        type: 'bizzbills',
        name: 'BizzBills',
        config: { email, connectedAs: body.name || null },
        isActive: true,
        lastSyncAt: new Date(),
      },
      update: {
        config: { email, connectedAs: body.name || null },
        isActive: true,
        lastSyncAt: new Date(),
        lastError: null,
      },
    });

    return res.json({
      success: true,
      data: {
        connected: integration.isActive,
        connectedAs: body.name || null,
        email,
        role: body.role || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bizzbills/disconnect
 * Remove BizzBills integration
 */
router.post('/disconnect', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await prisma.integration.deleteMany({
      where: { businessId, type: 'bizzbills' },
    });

    return res.json({ success: true, data: { connected: false } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
