const AuditLog = require('../models/catalog/AuditLog');

/**
 * Log a catalog action to the audit trail
 * @param {Object} auditContext Request-level context (userId, ipAddress, userAgent)
 * @param {Object} details Details of the action
 * @param {String} details.entityType Category, SubCategory, Attribute, Product, etc.
 * @param {String} details.entityId ObjectId of the record
 * @param {String} details.action CREATE, UPDATE, DELETE, RESTORE, ARCHIVE, etc.
 * @param {Object} [details.before] State before modification
 * @param {Object} [details.after] State after modification
 * @param {Object} [details.metadata] Extra unstructured metadata
 */
const logAction = async (auditContext = {}, details = {}) => {
    try {
        const { userId, ipAddress, userAgent } = auditContext;
        const { entityType, entityId, action, before, after, metadata } = details;

        await AuditLog.create({
            entityType,
            entityId,
            action,
            changes: { before, after },
            performedBy: userId,
            ipAddress,
            userAgent,
            metadata,
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
        // Do not fail the main request if logging fails in production
    }
};

/**
 * Get audit logs with filters and pagination
 */
const getAuditLogs = async (query = {}, pagination = {}) => {
    const { entityType, entityId, action, performedBy } = query;
    const { page = 1, limit = 50 } = pagination;

    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (action) filter.action = action;
    if (performedBy) filter.performedBy = performedBy;

    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filter)
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    return {
        logs,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

module.exports = {
    logAction,
    getAuditLogs,
};
