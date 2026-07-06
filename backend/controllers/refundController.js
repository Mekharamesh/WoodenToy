const Refund = require('../models/Refund');

// @desc    Get all refunds
// @route   GET /api/refunds
// @access  Private/Admin
const getRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find().sort({ createdAt: -1 });
    res.json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed sample refund data
// @route   POST /api/refunds/seed
// @access  Private/Admin
const seedRefunds = async (req, res) => {
  try {
    const count = await Refund.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Refunds already seeded' });
    }

    const sampleRefunds = [
      { orderId: '#WT10021', customerName: 'Suguna M', amount: 1880.00, paymentType: 'Cashfree', slaTimeline: '1H LEFT', status: 'Approved Refund', refundActionStatus: 'Refunded' },
      { orderId: '#WT10020', customerName: 'Ramesh K', amount: 750.00, paymentType: 'COD', slaTimeline: '3H LEFT', status: 'Pending', refundActionStatus: 'Refund' },
      { orderId: '#WT10019', customerName: 'Kavya S', amount: 1250.00, paymentType: 'Cashfree', slaTimeline: '8H LEFT', status: 'Processing', refundActionStatus: 'Processing' },
      { orderId: '#WT10018', customerName: 'Manoj T', amount: 560.00, paymentType: 'COD', slaTimeline: '15H LEFT', status: 'Failed', refundActionStatus: 'Failed' },
      { orderId: '#WT10017', customerName: 'Priya R', amount: 2300.00, paymentType: 'Cashfree', slaTimeline: '-', status: 'Completed', refundActionStatus: 'Refunded' },
      // Generate some extra random ones to total 20 as in the design
    ];

    // Pad with 15 more generic refunds to reach the 20 total refunds seen in the UI
    for (let i = 1; i <= 15; i++) {
      const isApproved = Math.random() > 0.3;
      sampleRefunds.push({
        orderId: `#WT100${16 - i < 10 ? '0' + (16 - i) : 16 - i}`,
        customerName: `Customer ${i}`,
        amount: Math.floor(Math.random() * 3000) + 500,
        paymentType: Math.random() > 0.4 ? 'Cashfree' : 'COD',
        slaTimeline: '-',
        status: isApproved ? 'Completed' : 'Pending',
        refundActionStatus: isApproved ? 'Refunded' : 'Refund'
      });
    }

    const created = await Refund.insertMany(sampleRefunds);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRefunds,
  seedRefunds,
};
