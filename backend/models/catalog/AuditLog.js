const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    entityType: {
        type: String,
        required: true,
        enum: ['Category', 'SubCategory', 'Attribute', 'AttributeValue', 'Product', 'ProductVariant', 'ProductImage', 'CategoryAttributeMapping'],
        index: true,
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'ARCHIVE', 'STATUS_CHANGE', 'BULK_UPDATE', 'BULK_DELETE', 'BULK_STATUS'],
    },
    changes: {
        before: { type: mongoose.Schema.Types.Mixed },
        after: { type: mongoose.Schema.Types.Mixed },
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
}, { timestamps: true });

// Indexes for efficient querying
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
