// Set environment variables for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
