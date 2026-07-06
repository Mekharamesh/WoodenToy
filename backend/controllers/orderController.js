const Order = require('../models/Order');
const Fee = require('../models/Fee');
const Refund = require('../models/Refund');
const CancellationRule = require('../models/CancellationRule');
const { calculateOrderFees } = require('../utils/feeCalculator');

const mapOrderStatusToRuleStatus = (status) => {
  const mapping = {
    'Placed': 'Order Placed',
    'Packed': 'Packed',
    'Shipping': 'Shipped',
    'Out for delivery': 'Out for Delivery',
    'Delivered': 'Delivered'
  };
  return mapping[status] || 'Order Placed';
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      orderNotes,
      fees
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    } else {
      const configuredFees = await Fee.find({ active: true })
        .populate('feeCategory', 'name')
        .populate('paymentMethod', 'name')
        .lean();

      const subtotal = Number(itemsPrice) || orderItems.reduce((sum, item) => (
        sum + ((Number(item.price) || 0) * (Number(item.qty) || 0))
      ), 0);

      const feeSummary = calculateOrderFees({
        fees: configuredFees,
        subtotal,
        items: orderItems,
        state: shippingAddress?.state,
        paymentMethod,
      });

      const extraChargeSum = feeSummary.extraFeesList.reduce((sum, fee) => sum + fee.amount, 0);
      const calculatedTotalPrice = subtotal + feeSummary.shippingCharge + extraChargeSum;
      const calculatedBalanceAmount = paymentMethod === 'COD' && feeSummary.codAdvance > 0
        ? calculatedTotalPrice - feeSummary.codAdvance
        : 0;

      const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice: subtotal,
        taxPrice,
        shippingPrice: feeSummary.shippingCharge,
        totalPrice: calculatedTotalPrice,
        codAdvance: feeSummary.codAdvance,
        balanceAmount: calculatedBalanceAmount,
        orderNotes,
        fees: feeSummary.appliedFees.length > 0 ? feeSummary.appliedFees : (Array.isArray(fees) ? fees : [])
      });

      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      // Check if order belongs to user or user is admin/staff
      const userRole = req.user.role?.toLowerCase();
      if (
        order.user._id.toString() !== req.user._id.toString() &&
        userRole !== 'admin' &&
        userRole !== 'manager' &&
        !req.user.isStaff
      ) {
         return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      order.status = 'Packed';

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = Order.VALID_STATUSES || [
      'Placed',
      'Shipping',
      'Out for delivery',
      'Delivered',
      'Cancelled',
      'Pending',
      'Packed',
      'Shipped',
    ];

    if (!validStatuses.includes(status)) {
      console.log('--- INVALID STATUS TRIGGERED ---');
      console.log('Received status:', `'${status}'`, 'Type:', typeof status);
      console.log('Valid statuses:', validStatuses);
      console.log('Order.VALID_STATUSES:', Order.VALID_STATUSES);
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const STATUS_WEIGHTS = {
      'Pending': 0,
      'Placed': 1,
      'Packed': 2,
      'Shipping': 3,
      'Shipped': 4,
      'Out for delivery': 5,
      'Delivered': 6,
      'Cancelled': 99
    };

    const currentWeight = STATUS_WEIGHTS[order.status] || 0;
    const newWeight = STATUS_WEIGHTS[status] || 0;

    if (status === 'Cancelled' && order.status === 'Delivered') {
      return res.status(400).json({ message: 'Cannot cancel a delivered order' });
    }

    if (status !== 'Cancelled' && newWeight < currentWeight) {
      return res.status(400).json({ message: 'Cannot move order status backwards' });
    }

    order.status = status;

    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      if (order.paymentMethod === 'COD' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }

    if (status === 'Cancelled') {
      order.isDelivered = false;
    }

    if (['Placed', 'Shipping', 'Out for delivery', 'Pending', 'Packed', 'Shipped'].includes(status)) {
      order.isDelivered = false;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'Delivered';

    if (order.paymentMethod === 'COD' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update order details
// @route   PUT /api/orders/:id/details
// @access  Private/Admin
const updateOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { shippingAddress, status, isPaid, paymentMethod, trackingId, trackingUrl } = req.body;

    if (shippingAddress) {
      order.shippingAddress = shippingAddress;
    }
    
    if (trackingId !== undefined) {
      order.trackingId = trackingId;
    }
    if (trackingUrl !== undefined) {
      order.trackingUrl = trackingUrl;
    }

    if (status && status !== order.status) {
      const STATUS_WEIGHTS = {
        'Pending': 0, 'Placed': 1, 'Packed': 2, 'Shipping': 3,
        'Shipped': 4, 'Out for delivery': 5, 'Delivered': 6, 'Cancelled': 99
      };
      
      const currentWeight = STATUS_WEIGHTS[order.status] || 0;
      const newWeight = STATUS_WEIGHTS[status] || 0;
      
      if (status !== 'Cancelled' && newWeight < currentWeight) {
        return res.status(400).json({ message: 'Cannot move order status backwards' });
      }
      if (order.status === 'Delivered' && status === 'Cancelled') {
        return res.status(400).json({ message: 'Cannot cancel a delivered order' });
      }
      
      order.status = status;
      if (status === 'Delivered' && !order.isDelivered) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }
    }
    
    if (isPaid !== undefined) {
      order.isPaid = isPaid;
      if (isPaid && !order.paidAt) {
        order.paidAt = Date.now();
      }
    }

    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get cancellation preview (fee and refund estimate)
// @route   GET /api/orders/:id/cancellation-preview
// @access  Private
const getCancellationPreview = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('orderItems.product', 'name image price');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const ruleMethod = order.paymentMethod === 'Cashfree' ? 'Online' : 'COD';
    const ruleStatus = mapOrderStatusToRuleStatus(order.status);

    const rule = await CancellationRule.findOne({
      paymentMethod: ruleMethod,
      orderStatus: ruleStatus
    });

    let cancellationFee = 0;
    let isAllowed = true;
    let notAllowedReason = '';

    let timeLimit = null;

    if (rule) {
      timeLimit = rule.timeLimit;
      if (!rule.isAllowed) {
        isAllowed = false;
        notAllowedReason = `Cancellation is not allowed when order is ${ruleStatus}`;
      } else {
        cancellationFee = rule.cancellationFee || 0;
      }
    }

    const amountPaid = order.paymentMethod === 'COD' ? 200 : order.totalPrice;
    const estimatedRefund = Math.max(0, amountPaid - cancellationFee);

    res.json({
      orderId: order._id,
      items: order.orderItems,
      shippingAndFees: (order.shippingPrice || 0) + (order.taxPrice || 0),
      totalOrderAmount: order.totalPrice,
      paymentMethod: order.paymentMethod,
      amountPaid,
      cancellationFee,
      estimatedRefund,
      isAllowed,
      notAllowedReason,
      ruleStatus,
      ruleMethod,
      timeLimit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Cancel order and create refund
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { refundDestination } = req.body || {};
    const order = await Order.findById(req.params.id).populate('user', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check cancellation rule
    const ruleMethod = order.paymentMethod === 'Cashfree' ? 'Online' : 'COD';
    const ruleStatus = mapOrderStatusToRuleStatus(order.status);
    const rule = await CancellationRule.findOne({ paymentMethod: ruleMethod, orderStatus: ruleStatus });

    let cancellationFee = 0;
    if (rule) {
      if (!rule.isAllowed) {
        return res.status(400).json({ message: `Cancellation is not allowed when order is ${ruleStatus}` });
      }
      cancellationFee = rule.cancellationFee || 0;
    }

    // Update order status to Cancelled
    order.status = 'Cancelled';
    const updatedOrder = await order.save();

    const amountPaid = order.paymentMethod === 'COD' ? 200 : order.totalPrice;
    const refundAmount = Math.max(0, amountPaid - cancellationFee);

    // Create a Refund entry
    const newRefund = new Refund({
      orderId: `#WT${order._id.toString().slice(-5).toUpperCase()}`,
      customerName: order.user ? order.user.name : 'Guest',
      amount: refundAmount,
      paymentType: order.paymentMethod === 'COD' ? 'COD' : 'Cashfree',
      slaTimeline: '24H LEFT',
      refundDestination: refundDestination || '',
      status: 'Pending',
      refundActionStatus: 'Refund'
    });
    
    await newRefund.save();

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  updateOrderDetails,
  cancelOrder,
  getCancellationPreview,
};
