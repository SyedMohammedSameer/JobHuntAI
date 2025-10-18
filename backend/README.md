# AI Job Hunt Backend

Backend API for the AI Job Hunt application built with Express.js, TypeScript, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key
- Stripe account (for payments)

### Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
```

4. **Edit `.env` file with your credentials:**
   - Add your MongoDB connection string
   - Add your JWT secrets (generate strong random strings)
   - Add your OpenAI API key
   - Add your Stripe keys

### Development

**Run in development mode:**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── models/          # Mongoose models
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middlewares/     # Custom middleware
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── dist/                # Compiled JavaScript (generated)
├── logs/                # Application logs (generated)
├── .env                 # Environment variables (create from .env.example)
├── package.json
└── tsconfig.json
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Short-lived (15 minutes) - used for API requests
- **Refresh Token**: Long-lived (7 days) - used to refresh access tokens

### Protected Routes

Include the access token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

## 🗄️ Database Models

### User
- Authentication & profile information
- Subscription tier (FREE/PREMIUM)
- Visa information tracking
- Monthly usage limits

### Job
- Job listings from various sources
- Visa sponsorship information
- University job listings
- AI-generated insights

### Application
- User's job applications
- Status tracking
- Interview dates & notes
- Match scores

### Resume
- User's resumes (base and tailored)
- AI metadata and scores
- File storage references

### CoverLetter
- AI-generated cover letters
- Customization options
- Quality scores

## 🔒 Security Features

- ✅ Helmet.js for HTTP headers security
- ✅ CORS configuration
- ✅ Rate limiting (100 req/15min general, 5 req/15min auth)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT token validation
- ✅ Input validation with express-validator
- ✅ Environment variable protection

## 📊 Subscription Tiers

### FREE Tier
- 5 AI resume tailoring per month
- 3 AI cover letters per month
- Job match scores
- Basic application tracking

### PREMIUM Tier
- Unlimited AI resume tailoring
- Unlimited AI cover letters
- Priority job matching
- Advanced analytics
- Email notifications

## 🧪 Testing

```bash
npm test
```

## 📝 Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## 🚀 Deployment

The backend is configured to deploy on Netlify Functions. See main `netlify.toml` for configuration.

## 🤝 Support

For issues or questions, contact: Mohammed Sameer Syed

## 📄 License

MIT License