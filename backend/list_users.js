const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1')
.then(async () => {
    const User = require('./models/User');
    const Staff = require('./models/Staff');
    const users = await User.find({}, 'name email role');
    const staff = await Staff.find({}, 'fullName email role status');
    console.log("=== USERS ===");
    console.log(users);
    console.log("=== STAFF ===");
    console.log(staff);
    process.exit(0);
});
