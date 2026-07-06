const CancellationRule = require('../models/CancellationRule');

// @desc    Get all cancellation rules
// @route   GET /api/cancellation-rules
// @access  Private/Admin
const getRules = async (req, res) => {
  try {
    const rules = await CancellationRule.find().sort({ createdAt: 1 });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a cancellation rule
// @route   POST /api/cancellation-rules
// @access  Private/Admin
const createRule = async (req, res) => {
  try {
    const rule = new CancellationRule(req.body);
    const createdRule = await rule.save();
    res.status(201).json(createdRule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a cancellation rule
// @route   PUT /api/cancellation-rules/:id
// @access  Private/Admin
const updateRule = async (req, res) => {
  try {
    const rule = await CancellationRule.findById(req.params.id);
    if (rule) {
      Object.assign(rule, req.body);
      const updatedRule = await rule.save();
      res.json(updatedRule);
    } else {
      res.status(404).json({ message: 'Rule not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a cancellation rule
// @route   DELETE /api/cancellation-rules/:id
// @access  Private/Admin
const deleteRule = async (req, res) => {
  try {
    const rule = await CancellationRule.findById(req.params.id);
    if (rule) {
      await rule.deleteOne();
      res.json({ message: 'Rule removed' });
    } else {
      res.status(404).json({ message: 'Rule not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed initial cancellation rules (if empty)
// @route   POST /api/cancellation-rules/seed
// @access  Private/Admin
const seedRules = async (req, res) => {
  try {
    const count = await CancellationRule.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Rules already seeded' });
    }
    
    const initialRules = [
      { paymentMethod: 'COD', orderStatus: 'Order Placed', cancellationFee: 20, refundPercentage: 100, timeLimit: '24 Hours', isAllowed: true, status: 'Active' },
      { paymentMethod: 'COD', orderStatus: 'Packed', cancellationFee: 60, refundPercentage: 80, timeLimit: '48 Hours', isAllowed: true, status: 'Active' },
      { paymentMethod: 'COD', orderStatus: 'Shipped', cancellationFee: 150, refundPercentage: 50, timeLimit: 'Before Delivery', isAllowed: true, status: 'Active' },
      { paymentMethod: 'COD', orderStatus: 'Out for Delivery', cancellationFee: 250, refundPercentage: 20, timeLimit: 'Before Delivery', isAllowed: false, status: 'Disabled' },
      { paymentMethod: 'COD', orderStatus: 'Delivered', cancellationFee: 0, refundPercentage: 0, timeLimit: '-', isAllowed: false, status: 'Locked' },
      
      { paymentMethod: 'Online', orderStatus: 'Order Placed', cancellationFee: 0, refundPercentage: 100, timeLimit: '24 Hours', isAllowed: true, status: 'Active' },
      { paymentMethod: 'Online', orderStatus: 'Packed', cancellationFee: 50, refundPercentage: 90, timeLimit: '48 Hours', isAllowed: true, status: 'Active' },
      { paymentMethod: 'Online', orderStatus: 'Shipped', cancellationFee: 100, refundPercentage: 70, timeLimit: 'Before Delivery', isAllowed: true, status: 'Active' },
      { paymentMethod: 'Online', orderStatus: 'Out for Delivery', cancellationFee: 200, refundPercentage: 30, timeLimit: 'Before Delivery', isAllowed: false, status: 'Disabled' },
      { paymentMethod: 'Online', orderStatus: 'Delivered', cancellationFee: 0, refundPercentage: 0, timeLimit: '-', isAllowed: false, status: 'Locked' }
    ];
    
    const created = await CancellationRule.insertMany(initialRules);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  seedRules,
};
