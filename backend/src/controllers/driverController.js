const Driver = require('../models/Driver');
const User = require('../models/User');
const logAuditAction = require('../utils/auditLogger');
const { canAccessBranch, canAccessTenant } = require('../middleware/authMiddleware');

// @desc Get list of drivers with real DB search, branch scoping, and pagination
// @route GET /api/drivers
const getDrivers = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    let query = { ...req.branchFilter };

    if (status && status !== 'ALL') query.status = status;

    // Real MongoDB search instead of in-memory Javascript filtering
    if (search) {
      const searchUsers = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const userIds = searchUsers.map(u => u._id);

      query.$or = [
        { licenseNumber: { $regex: search, $options: 'i' } },
        { licenseClass: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const total = await Driver.countDocuments(query);
    res.set('X-Total-Count', total);

    let queryBuilder = Driver.find(query)
      .populate('user', 'name email phone role avatar')
      .populate('branch')
      .populate('assignedVehicle', 'plateNumber make model type')
      .sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      queryBuilder = queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const drivers = await queryBuilder;

    if (req.query.paginated === 'true') {
      const limitNum = parseInt(limit, 10) || 10;
      return res.json({
        data: drivers,
        pagination: {
          total,
          page: parseInt(page, 10) || 1,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new driver (links to existing or newly created User with role 'Driver')
// @route POST /api/drivers
const createDriver = async (req, res) => {
  try {
    const { name, email, password, phone, licenseNumber, licenseClass, licenseExpiryDate, medicalCertExpiryDate, branch, drivingExperienceYears } = req.body;

    if (!name || !email || !licenseNumber || !licenseClass || !licenseExpiryDate) {
      return res.status(400).json({ message: 'Name, email, license number, license class, and expiry date are required' });
    }

    const existingPlate = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase() });
    if (existingPlate) {
      return res.status(400).json({ message: `Driver with license '${licenseNumber}' already registered` });
    }

    // Branch assignment security
    let targetBranch;
    if (req.user.role === 'Branch Manager') {
      targetBranch = req.user.branch ? (req.user.branch._id || req.user.branch) : null;
    } else {
      targetBranch = branch || (req.user.branch ? (req.user.branch._id || req.user.branch) : null);
    }

    if (!targetBranch) {
      return res.status(400).json({ message: 'Branch assignment is required' });
    }

    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : null;

    const existingUser = await User.findOne({ email });
    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      user = await User.create({
        name,
        email,
        password: password || 'Driver@123',
        role: 'Driver',
        branch: targetBranch,
        organization,
        phone
      });
    }

    const driver = await Driver.create({
      user: user._id,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseClass,
      licenseExpiryDate,
      medicalCertExpiryDate,
      drivingExperienceYears: drivingExperienceYears ? Number(drivingExperienceYears) : 3,
      branch: targetBranch,
      organization
    });

    const populated = await Driver.findById(driver._id)
      .populate('user', 'name email phone role avatar')
      .populate('branch');

    await logAuditAction({
      action: 'CREATE_DRIVER',
      user: req.user,
      details: `Created driver profile for ${user.name} (${licenseNumber})`,
      branch: targetBranch,
      organization
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update driver profile with isolation check
// @route PUT /api/drivers/:id
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    if (!canAccessTenant(req.user, driver.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization driver modification forbidden' });
    }
    if (!canAccessBranch(req.user, driver.branch)) {
      return res.status(403).json({ message: 'Access denied: Driver belongs to another branch' });
    }

    // Prevent Branch Manager from moving driver to another branch
    if (req.user.role === 'Branch Manager' && req.body.branch) {
      const userBranchId = (req.user.branch?._id || req.user.branch).toString();
      if (req.body.branch.toString() !== userBranchId) {
        return res.status(403).json({ message: 'Branch Managers cannot reassign drivers to external branches' });
      }
    }

    Object.assign(driver, req.body);
    await driver.save();

    const updated = await Driver.findById(driver._id)
      .populate('user', 'name email phone role avatar')
      .populate('branch')
      .populate('assignedVehicle');

    await logAuditAction({
      action: 'UPDATE_DRIVER',
      user: req.user,
      details: `Updated driver info for driver ID ${driver._id}`,
      branch: driver.branch,
      organization: driver.organization
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDrivers,
  createDriver,
  updateDriver
};
