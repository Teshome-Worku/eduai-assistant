/**
 * Script to promote a user to admin role.
 * 
 * Usage:
 *   node scripts/makeAdmin.js <email>
 * 
 * Example:
 *   node scripts/makeAdmin.js yourname@example.com
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const makeAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node scripts/makeAdmin.js <email>');
    console.error('Example: node scripts/makeAdmin.js admin@example.com');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User with email "${email}" not found.`);
      console.log('\nRegistered users:');
      const users = await User.find().select('name email role').lean();
      users.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) [${u.role || 'user'}]`);
      });
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`User "${user.name}" (${user.email}) is already an admin.`);
    } else {
      user.role = 'admin';
      await user.save();
      console.log(`Successfully promoted "${user.name}" (${user.email}) to admin!`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

makeAdmin();
