const Fee = require('../models/Fee');
const FeeCategory = require('../models/FeeCategory');
const PaymentMethod = require('../models/PaymentMethod');

// ==========================================
// FEE MANAGEMENT CONTROLLERS
// ==========================================

// Get all fees
exports.getFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('feeCategory', 'name')
      .populate('paymentMethod', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ message: 'Server error fetching fees', error: error.message });
  }
};

// Get single fee by ID
exports.getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('feeCategory', 'name')
      .populate('paymentMethod', 'name');
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    res.status(200).json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching fee', error: error.message });
  }
};

// Create a new fee
exports.createFee = async (req, res) => {
  try {
    const {
      paymentMethod,
      feeName,
      feeCategory,
      feeType,
      applicationState,
      weightSlabs,
      active
    } = req.body;

    const newFee = new Fee({
      paymentMethod,
      feeName,
      feeCategory,
      feeType,
      applicationState,
      weightSlabs,
      active
    });

    const savedFee = await newFee.save();
    res.status(201).json(savedFee);
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ message: 'Server error creating fee', error: error.message });
  }
};

// Update an existing fee
exports.updateFee = async (req, res) => {
  try {
    const updatedFee = await Fee.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedFee) return res.status(404).json({ message: 'Fee not found' });
    res.status(200).json(updatedFee);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating fee', error: error.message });
  }
};

// Delete a fee
exports.deleteFee = async (req, res) => {
  try {
    const deletedFee = await Fee.findByIdAndDelete(req.params.id);
    if (!deletedFee) return res.status(404).json({ message: 'Fee not found' });
    res.status(200).json({ message: 'Fee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting fee', error: error.message });
  }
};

// ==========================================
// FEE CATEGORY CONTROLLERS
// ==========================================

exports.getFeeCategories = async (req, res) => {
  try {
    const categories = await FeeCategory.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching fee categories', error: error.message });
  }
};

exports.createFeeCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    // Check if exists
    const existing = await FeeCategory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Fee category already exists' });
    }

    const newCategory = new FeeCategory({ name, isActive });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating fee category', error: error.message });
  }
};

// ==========================================
// PAYMENT METHOD CONTROLLERS
// ==========================================

exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find().sort({ name: 1 });
    res.status(200).json(methods);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching payment methods', error: error.message });
  }
};

exports.createPaymentMethod = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const existing = await PaymentMethod.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Payment method already exists' });
    }

    const newMethod = new PaymentMethod({ name, isActive });
    const saved = await newMethod.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating payment method', error: error.message });
  }
};
