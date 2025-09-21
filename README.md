# GreenCart Logistics - Delivery Simulation & KPI Dashboard

A full-stack web application for GreenCart Logistics, an eco-friendly delivery company, that simulates delivery operations and calculates KPIs based on custom business rules. This internal tool helps managers experiment with staffing, delivery schedules, and route allocations to optimize profits and efficiency.

## 🚀 Project Overview

GreenCart Logistics is a comprehensive delivery management system that provides:

- **Delivery Simulation Engine**: Optimizes driver-order assignments based on custom business rules
- **Real-time KPI Dashboard**: Displays profit, efficiency scores, and delivery metrics
- **Management Interface**: Full CRUD operations for drivers, routes, and orders
- **Advanced Analytics**: Visual charts for delivery status and fuel cost breakdowns
- **Role-based Authentication**: Secure access for managers and administrators

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Cloud-hosted)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, bcrypt password hashing
- **Validation**: express-validator
- **Testing**: Jest & Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Charts**: Chart.js with react-chartjs-2
- **Styling**: CSS3 with responsive design

## 📊 Business Logic & KPI Rules

The simulation engine implements these proprietary business rules:

### 1. Late Delivery Penalty
- **Rule**: If delivery time > (base route time + 10 minutes) → ₹50 penalty
- **Impact**: Reduces order profit and affects efficiency score

### 2. Driver Fatigue System
- **Rule**: If driver works >8 hours in a day → 30% speed reduction next day
- **Implementation**: Calculated from past week work hours

### 3. High-Value Order Bonus
- **Rule**: Orders >₹1000 AND delivered on time → 10% bonus
- **Calculation**: Added to order profit for premium deliveries

### 4. Dynamic Fuel Cost Calculation
- **Base Cost**: ₹5/km per route
- **High Traffic Surcharge**: Additional ₹2/km for high-traffic routes

### 5. Overall Profit Formula
```
Profit = Σ(Order Value + Bonuses - Penalties - Fuel Costs)
```

### 6. Efficiency Score
```
Efficiency = (On-time Deliveries / Total Deliveries) × 100
```

## ⚙ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB Atlas account (for cloud database)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/sanket-67/GreenCart-Logistics.git
cd GreenCart-Logistics
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file from example
cp .env.example .env

# Edit .env with your MongoDB connection string
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/greencart

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Default Login Credentials
After setting up the backend:
- **Email**: `admin@greencart.com`
- **Password**: `admin123`

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greencart

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## 📡 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register    # Register new user
POST /api/auth/login       # User login
GET  /api/auth/verify      # Verify JWT token
```

### Simulation Engine
```http
POST /api/simulation/run           # Run new simulation
GET  /api/simulation/history       # Get simulation history
GET  /api/simulation/stats/overview # Get simulation statistics
```

### CRUD Operations
```http
# Drivers
GET/POST/PUT/DELETE /api/drivers[/:id]

# Routes  
GET/POST/PUT/DELETE /api/routes[/:id]

# Orders
GET/POST/PUT/DELETE /api/orders[/:id]
```

### Example Simulation Request
```json
POST /api/simulation/run
{
  "numberOfDrivers": 5,
  "startTime": "09:00",
  "maxHoursPerDriver": 8
}
```

### Example Response
```json
{
  "simulationId": "...",
  "results": {
    "totalProfit": 85420,
    "efficiencyScore": 87.5,
    "onTimeDeliveries": 42,
    "lateDeliveries": 6,
    "totalDeliveries": 48,
    "fuelCostBreakdown": {
      "lowTraffic": 1250,
      "mediumTraffic": 2100,
      "highTraffic": 3200
    }
  }
}
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
```

Includes:
- Unit tests for simulation engine
- Integration tests for API endpoints
- Authentication middleware testing
- Data validation testing

## 🚦 Development Scripts

### Backend
```bash
npm start              # Production server
npm run dev            # Development with nodemon
npm test              # Run test suite
```

### Frontend
```bash
npm start             # Development server
npm run build         # Production build
npm test             # Run test suite
```

## 🌟 Key Features

### 1. Advanced Simulation Engine
- Intelligent driver-order assignment algorithm
- Real-time fatigue calculation and management
- Traffic-aware route optimization
- Dynamic pricing with bonuses and penalties

### 2. Comprehensive Dashboard
- Real-time KPI monitoring
- Interactive charts for delivery metrics
- Fuel cost breakdown visualization
- Historical simulation comparison

### 3. Management Tools
- Complete CRUD operations for all entities
- Advanced filtering and search capabilities
- Responsive design for all devices

### 4. Security & Performance
- JWT-based authentication system
- Role-based access control
- Rate limiting and security headers
- Optimized database queries

## 🚀 Deployment

### Backend (Render/Railway/Heroku)
1. Connect GitHub repository
2. Set environment variables
3. Deploy with `npm start` command

### Frontend (Vercel/Netlify)  
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`

### Database (MongoDB Atlas)
1. Create MongoDB Atlas cluster
2. Configure network access
3. Get connection string for environment variables

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Input validation
- Rate limiting
- Security headers with Helmet.js

## 📈 Performance Optimizations

- Database indexing for optimized queries
- API rate limiting
- Efficient chart rendering
- Lazy loading for components

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and commit
4. Push to branch
5. Create Pull Request

## 📝 License

This project is licensed under the ISC License.

---

**Built for Purple Merit Technologies Full-Stack Developer Assessment**

**Assessment Deliverables:**
- ✅ Full-stack application with React & Node.js
- ✅ MongoDB database with cloud hosting
- ✅ JWT authentication system
- ✅ Simulation engine with custom business logic
- ✅ Interactive charts and dashboard
- ✅ CRUD operations for all entities
- ✅ Comprehensive API documentation
- ✅ Unit tests for backend logic
- ✅ Responsive design for mobile & desktop
- ✅ Environment configuration
- ✅ Git version control with proper commits