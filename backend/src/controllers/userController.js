const User = require('../models/User');

async function updateMe(req, res, next) {
  try {
    const { name } = req.validatedBody;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateMe,
};
