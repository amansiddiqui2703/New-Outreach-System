import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';

const makeAdmin = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Find all users
        const users = await User.find({});
        if (users.length === 0) {
            console.log('No users found in database. Create an account first!');
            process.exit(0);
        }

        // Make the first user an admin (or all of them for now so the user can see it)
        for (const user of users) {
            user.role = 'admin';
            await user.save();
            console.log(`Updated user ${user.email} to Admin!`);
        }

        console.log('✅ Success! You should now see the Admin Panel in your dashboard sidebar.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

makeAdmin();
