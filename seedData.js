import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Resource from './models/Resource.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Resource.deleteMany({});
    console.log('Existing data cleared');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@edu.com',
      password: 'admin123',
      role: 'admin'
    });

    // Create regular users
    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@edu.com',
      password: 'user123',
      role: 'user'
    });

    const user2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@edu.com',
      password: 'user123',
      role: 'user'
    });

    console.log('Users created');

    // Create sample resources
    const resources = [
      {
        title: 'Introduction to Computer Science',
        type: 'Textbook',
        description: 'Comprehensive guide covering fundamental concepts of computer science including algorithms, data structures, and programming principles.',
        subject: 'Computer Science',
        fileUrl: 'https://example.com/cs-intro.pdf',
        fileName: 'cs-intro.pdf',
        fileSize: 5242880,
        uploadedBy: admin._id,
        uploadedByName: admin.name,
        tags: ['programming', 'algorithms', 'fundamentals'],
        feedback: [
          {
            user: user1._id,
            userName: user1.name,
            rating: 5,
            comment: 'Excellent resource for beginners!'
          }
        ]
      },
      {
        title: 'Advanced Machine Learning Techniques',
        type: 'Research Paper',
        description: 'In-depth analysis of modern machine learning algorithms and their applications in real-world scenarios.',
        subject: 'Artificial Intelligence',
        fileUrl: 'https://example.com/ml-advanced.pdf',
        fileName: 'ml-advanced.pdf',
        fileSize: 2097152,
        uploadedBy: admin._id,
        uploadedByName: admin.name,
        tags: ['machine learning', 'AI', 'research'],
        feedback: [
          {
            user: user2._id,
            userName: user2.name,
            rating: 4,
            comment: 'Great insights, though quite technical.'
          }
        ]
      },
      {
        title: 'Calculus I Study Guide',
        type: 'Study Guide',
        description: 'Complete study guide for Calculus I covering limits, derivatives, integrals, and applications.',
        subject: 'Mathematics',
        fileUrl: 'https://example.com/calculus-guide.pdf',
        fileName: 'calculus-guide.pdf',
        fileSize: 1048576,
        uploadedBy: admin._id,
        uploadedByName: admin.name,
        tags: ['calculus', 'math', 'derivatives', 'integrals'],
        feedback: []
      },
      {
        title: 'Data Structures and Algorithms',
        type: 'Lecture Notes',
        description: 'Detailed lecture notes covering arrays, linked lists, trees, graphs, sorting, and searching algorithms.',
        subject: 'Computer Science',
        fileUrl: 'https://example.com/dsa-notes.pdf',
        fileName: 'dsa-notes.pdf',
        fileSize: 3145728,
        uploadedBy: admin._id,
        uploadedByName: admin.name,
        tags: ['data structures', 'algorithms', 'programming'],
        feedback: [
          {
            user: user1._id,
            userName: user1.name,
            rating: 5,
            comment: 'Very helpful notes with clear examples.'
          },
          {
            user: user2._id,
            userName: user2.name,
            rating: 5,
            comment: 'Best DSA resource I have found!'
          }
        ]
      },
      {
        title: 'Physics for Engineers',
        type: 'Textbook',
        description: 'Engineering physics covering mechanics, thermodynamics, electromagnetism, and modern physics.',
        subject: 'Physics',
        fileUrl: 'https://example.com/physics-eng.pdf',
        fileName: 'physics-eng.pdf',
        fileSize: 7340032,
        uploadedBy: admin._id,
        uploadedByName: admin.name,
        tags: ['physics', 'engineering', 'mechanics'],
        feedback: []
      },
      {
        title: 'Web Development Fundamentals',
        type: 'Study Guide',
        description: 'Complete guide to HTML, CSS, JavaScript, and modern web development frameworks.',
        subject: 'Web Development',
        fileUrl: 'https://example.com/web-dev.pdf',
        fileName: 'web-dev.pdf',
        fileSize: 4194304,
        uploadedBy: admin._id,
        uploadedByName: admin.name,
        tags: ['web', 'HTML', 'CSS', 'JavaScript'],
        feedback: [
          {
            user: user1._id,
            userName: user1.name,
            rating: 4,
            comment: 'Good starting point for web development.'
          }
        ]
      }
    ];

    for (let resourceData of resources) {
      const resource = await Resource.create(resourceData);
      resource.calculateAverageRating();
      await resource.save();
    }

    console.log('Sample resources created');
    console.log('\n=== Seed Data Summary ===');
    console.log('Admin credentials: admin@edu.com / admin123');
    console.log('User credentials: john@edu.com / user123');
    console.log('User credentials: jane@edu.com / user123');
    console.log(`Total resources created: ${resources.length}`);
    console.log('=========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
