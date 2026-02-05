import AuditLog from '../models/AuditLog.js';

export const logAction = async (data) => {
  try {
    const auditLog = new AuditLog(data);
    await auditLog.save();
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

export const createAuditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      // Log after response is sent
      if (res.statusCode < 400) {
        logAction({
          userId: req.user?._id,
          action,
          entityType,
          entityId: req.params.id || req.body.id,
          newValues: req.body,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      return originalSend.call(this, data);
    };
    next();
  };
};






