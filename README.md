# Victoria Kids Shop - Backend API

This is the backend API for Victoria Kids Shop, a production-ready e-commerce platform for baby products.

## Features

- User authentication and authorization
- Product management
- Shopping cart functionality
- Order processing
- Wishlist/favorites
- Admin dashboard with sales reports
- Payment processing with Stripe

## Tech Stack

- Node.js
- Express.js
- MySQL
- JWT Authentication
- Stripe Payment Integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/victoria-kids-shop.git
   cd victoria-kids-shop/backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the setup script to create `.env` file and initialize the database
   ```bash
   npm run setup
   ```
   
   The setup script will:
   - Create a `.env` file with default values if it doesn't exist
   - Create the database and tables if they don't exist
   - Add sample data for development mode

### Running the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## API Documentation

### Auth Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/logout` - Logout a user
- `GET /api/auth/profile` - Get user profile

### Product Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a product by ID
- `GET /api/products/featured` - Get featured products
- `GET /api/products/new` - Get new arrivals
- `GET /api/products/budget` - Get budget-friendly products
- `GET /api/products/luxury` - Get luxury products

### Category Endpoints

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a category by ID
- `GET /api/categories/:id/products` - Get products by category

### Order Endpoints

- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get an order by ID
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id/status` - Update order status

### Cart Endpoints

- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add an item to cart
- `PUT /api/cart/:productId` - Update cart item quantity
- `DELETE /api/cart/:productId` - Remove an item from cart

### Favorites Endpoints

- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add a product to favorites
- `DELETE /api/favorites/:productId` - Remove a product from favorites
- `GET /api/favorites/check/:productId` - Check if a product is in favorites

### Admin Endpoints

- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/dashboard/recent-orders` - Get recent orders
- `GET /api/admin/dashboard/low-stock` - Get low stock products
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/reports/sales` - Generate sales report

### Payment Endpoints

- `POST /api/payments/create-payment-intent` - Create a payment intent
- `POST /api/payments/webhook` - Stripe webhook endpoint

## Production Deployment

For production deployment, make sure to:

1. Update the `.env` file with your production database credentials
2. Set `NODE_ENV=production` in your environment
3. Set proper values for JWT_SECRET and Stripe keys
4. Implement additional security measures like rate limiting
5. Set up a process manager like PM2 to keep the application running

```bash
# Example PM2 setup
npm install -g pm2
pm2 start server.js --name "victoria-kids-api"
```

## Database Migrations

The application includes a database migration system to manage schema changes and data seeding. This ensures that your database schema stays in sync with your codebase, making it easier to deploy and maintain the application.

### Running Migrations

To apply all pending migrations:

```bash
npm run migrate
# or
npm run migrate:up
```

To roll back the most recent migration:

```bash
npm run migrate:down
```

To roll back all migrations:

```bash
node migrate.js down --all
```

### Creating New Migrations

To create a new migration file:

```bash
npm run migrate:create your_migration_name
```

This will create a new migration file in the `migrations` directory with a timestamp prefix.

### Migration File Structure

Each migration file exports `up` and `down` functions:

```javascript
// Example migration file
const up = async (connection) => {
  // Code to apply the migration
  await connection.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    )
  `);
};

const down = async (connection) => {
  // Code to rollback the migration
  await connection.query('DROP TABLE users');
};

module.exports = { up, down };
```

### Quick Setup

For a quick start, you can run:

```bash
npm run db:setup
```

This will apply all migrations and start the development server.

## Troubleshooting

### Port Already in Use

If you see an error like `Error: listen EADDRINUSE: address already in use :::5000`, it means port 5000 is already being used by another process. The server will automatically try the next available port (5001, 5002, etc.).

If you want to specify a different port:

1. Change the PORT in your .env file:
   ```
   PORT=5001
   ```

2. Or specify the port when starting the server:
   ```bash
   PORT=5001 npm start
   ```

### Database Connection Issues

If you encounter database connection issues:

1. Make sure your MySQL server is running
2. Verify your database credentials in the .env file
3. Try running the setup script again:
   ```bash
   npm run setup
   ```

4. In development mode, the server will continue to run with mock data even if the database connection fails. In production mode, it will exit if the database connection fails.

## Using the API in Development Mode

In development mode, you can use the following features to test the API more easily:

### Mock User Authentication

To bypass authentication in development mode, add the `x-mock-user` header to your requests:

```
x-mock-user: true
```

To test admin features, add both headers:

```
x-mock-user: true
x-mock-role: admin
```

## License

MIT 