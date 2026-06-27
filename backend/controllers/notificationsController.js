const prisma = require('../utils/prisma');

/**
 * POST /api/notifications/send
 * Sends a notification to a specific user recipient.
 */
async function sendNotification(req, res, next) {
  try {
    const { recipientId, title, message } = req.body;

    if (!recipientId || !title || !message) {
      return res.status(400).json({ error: 'recipientId, title, and message are required.' });
    }

    // Verify recipient exists
    const recipientExists = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipientExists) {
      return res.status(404).json({ error: 'Recipient user not found.' });
    }

    const notification = await prisma.notification.create({
      data: {
        recipientId,
        title,
        message
      }
    });

    res.status(201).json({ message: 'Notification sent successfully.', notification });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notifications/my
 * Retrieves all notifications for the authenticated user.
 */
async function getMyNotifications(req, res, next) {
  try {
    const recipientId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { recipientId },
      orderBy: [
        { isRead: 'asc' },
        { sentAt: 'desc' }
      ]
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/notifications/:id/read
 * Marks a notification as read.
 */
async function markAsRead(req, res, next) {
  try {
    const recipientId = req.user.id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, recipientId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or access denied.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ message: 'Notification marked as read.', notification: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/notifications/read-all
 * Marks all notifications for the authenticated user as read.
 */
async function markAllAsRead(req, res, next) {
  try {
    const recipientId = req.user.id;

    const result = await prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read.', count: result.count });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
