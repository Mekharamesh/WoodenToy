const Staff = require('../models/Staff');
const { PERMISSION_MODULES } = require('../models/Staff');

// ─── GET ALL STAFF ────────────────────────────────────────────────────────────
const getAllStaff = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const total = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, staff, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET SINGLE STAFF ─────────────────────────────────────────────────────────
const getStaffById = async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id).select('-password');
    if (!member) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, staff: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE STAFF ─────────────────────────────────────────────────────────────
const createStaff = async (req, res) => {
  try {
    const { fullName, email, mobile, password, role, status } = req.body;

    // Validate required
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'fullName, email, password, and role are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const existing = await Staff.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'A staff member with this email already exists.' });

    // Default permissions: view only for all modules
    const defaultPermissions = PERMISSION_MODULES.map(mod => ({ module: mod, view: false, create: false, edit: false, delete: false }));

    const staff = await Staff.create({
      fullName,
      email,
      mobile: mobile || '',
      password,
      role,
      status: status || 'active',
      permissions: defaultPermissions,
      createdBy: req.user?._id,
    });

    const result = staff.toObject();
    delete result.password;
    res.status(201).json({ success: true, staff: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE STAFF ─────────────────────────────────────────────────────────────
const updateStaff = async (req, res) => {
  try {
    const { fullName, email, mobile, role, status, password } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    if (fullName) staff.fullName = fullName;
    if (email) staff.email = email;
    if (mobile !== undefined) staff.mobile = mobile;
    if (role) staff.role = role;
    if (status) staff.status = status;
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      staff.password = password;
    }

    const updated = await staff.save();
    const result = updated.toObject();
    delete result.password;
    res.json({ success: true, staff: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE STAFF ─────────────────────────────────────────────────────────────
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff member deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE PERMISSIONS ───────────────────────────────────────────────────────
const updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    staff.permissions = permissions;
    await staff.save();
    const result = staff.toObject();
    delete result.password;
    res.json({ success: true, staff: result, message: 'Permissions updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET PERMISSION MODULES LIST ─────────────────────────────────────────────
const getPermissionModules = async (req, res) => {
  res.json({ success: true, modules: PERMISSION_MODULES });
};

module.exports = { getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff, updatePermissions, getPermissionModules };
