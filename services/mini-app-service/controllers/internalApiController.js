import UserAppInstall from '../models/UserAppInstall.js';
import MiniApp from '../models/MiniApp.js';

/**
 * Bridge API: Called by mini apps to get the user's context
 * (profile, granted permissions, payment context etc.)
 */
const getUserContext = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { appId } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const install = await UserAppInstall.findOne({ userId, appId });
    if (!install) return res.status(403).json({ error: 'App not installed or permissions not granted' });

    const app = await MiniApp.findOne({ appId });
    if (!app || app.status !== 'active') {
      return res.status(404).json({ error: 'App not found or inactive' });
    }

    // Only return the permissions the user has actually granted
    const grantedPermissions = install.grantedPermissions;

    const context = {
      userId,
      appId,
      appName: app.name,
      grantedPermissions,
      // For each permission, include minimal context
      identity: grantedPermissions.includes('identity') ? { userId } : null,
      location: grantedPermissions.includes('location') ? { granted: true } : null,
      payments: grantedPermissions.includes('payments') ? { granted: true } : null,
      notifications: grantedPermissions.includes('notifications') ? { granted: true } : null,
    };

    res.json({ status: 'success', data: context });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Bridge API: Mini app triggers a notification via the platform
 */
const notify = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { appId, title, message, data } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check the app has notification permission
    const install = await UserAppInstall.findOne({ userId, appId });
    if (!install || !install.grantedPermissions.includes('notifications')) {
      return res.status(403).json({ error: 'Notification permission not granted for this app' });
    }

    // In production, this would call the notification-service via HTTP/Kafka
    // For now, log and acknowledge
    console.log(`[MiniApp:${appId}] Notification to ${userId}: ${title} - ${message}`);

    res.json({ status: 'success', message: 'Notification queued' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Bridge API: Request an in-app payment from the user
 * (Mini app calls this; the payment UI is shown to the user natively)
 */
const requestPayment = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { appId, amount, description, callbackUrl } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const install = await UserAppInstall.findOne({ userId, appId });
    if (!install || !install.grantedPermissions.includes('payments')) {
      return res.status(403).json({ error: 'Payment permission not granted for this app' });
    }

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // Return a payment intent token that the frontend uses to show the payment sheet
    const paymentIntent = {
      intentId: `pi_${Date.now()}`,
      appId,
      userId,
      amount,
      description,
      callbackUrl,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    res.json({ status: 'success', data: paymentIntent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default { getUserContext, notify, requestPayment };
