const Driver = require('../models/Driver');
const User = require('../models/User');
const logAuditAction = require('../utils/auditLogger');

// @desc Get list of drivers
// @route GET /api/drivers
const getDrivers = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = { ...req.branchFilter };

    if (status) query.status = status;

    let drivers = await Driver.find(query)
      .populate('user', 'name email phone role avatar')
      .populate('branch')
      .populate('assignedVehicle', 'plateNumber make model type')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      drivers = drivers.filter(d => 
        (d.user && d.user.name.toLowerCase().includes(s)) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(s)) ||
        (d.licenseClass && d.licenseClass.toLowerCase().includes(s))
      );
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
        branch,
        phone
      });
    }

    const driver = await Driver.create({
      user: user._id,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseClass,
      licenseExpiryDate,
      medicalCertExpiryDate,
      drivingExperienceYears: drivingExperienceYears || 3,
      branch: branch || user.branch
    });

    const populated = await Driver.findById(driver._id)
      .populate('user', 'name email phone role')
      .populate('branch');

    await logAuditAction({
      action: 'CREATE_DRIVER',
      user: req.user,
      details: `Created driver profile for ${user.name} (${licenseNumber})`,
      branch: driver.branch
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update driver profile
// @route PUT /api/drivers/:id
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    Object.assign(driver, req.body);
    await driver.save();

    const updated = await Driver.findById(driver._id)
      .populate('user', 'name email phone role')
      .populate('branch')
      .populate('assignedVehicle');

    await logAuditAction({
      action: 'UPDATE_DRIVER',
      user: req.user,
      details: `Updated driver info for driver ID ${driver._id}`,
      branch: driver.branch
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
