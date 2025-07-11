# BloodCare API 🩸

A comprehensive REST API for blood donation management system built with Node.js, Express, and MongoDB. This API supports user registration, blood request management, donor matching, notifications, and more.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based auth with refresh tokens
- **Blood Request Management** - Create, manage, and respond to blood requests
- **Donor Search & Matching** - Smart donor matching based on blood compatibility
- **Real-time Notifications** - Push notifications and in-app messaging
- **Location Services** - Location-based donor and request searching
- **Achievement System** - Gamification with badges and rewards
- **Analytics & Reporting** - Donation statistics and trends

### Security Features
- JWT token authentication with refresh tokens
- Rate limiting and request throttling
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Account lockout after failed attempts

### Technical Features
- RESTful API design
- MongoDB with Mongoose ODM
- Comprehensive error handling
- Request/response logging
- API documentation
- File upload support
- Email notifications
- OTP verification

## 📋 API Endpoints

### 🔐 Authentication & User Management (7 endpoints)
```
POST    /auth/register           → User registration (donor/recipient)
POST    /auth/login              → User login (JWT token)
POST    /auth/logout             → Logout
POST    /auth/refresh-token      → JWT refresh token
POST    /auth/forgot-password    → Password reset link
POST    /auth/reset-password     → Set new password
POST    /auth/verify-otp         → OTP verification
```

### 👤 User Profile Management (8 endpoints)
```
GET     /user/profile            → Get user profile
PUT     /user/profile            → Update profile
POST    /user/upload-avatar      → Upload profile picture
GET     /user/stats              → Personal statistics
PUT     /user/availability       → Toggle availability status
GET     /user/achievements       → Achievement badges
PUT     /user/settings           → Notification & privacy settings
DELETE  /user/account            → Delete account
```

### 🩸 Blood Request Management (9 endpoints)
```
POST    /requests/create         → Create blood request
GET     /requests                → All blood requests (with filters)
GET     /requests/:id            → Specific request details
PUT     /requests/:id            → Update request
DELETE  /requests/:id            → Cancel request
GET     /requests/emergency      → Emergency requests
POST    /requests/:id/respond    → Respond to request
GET     /requests/my-requests    → My requests
GET     /requests/nearby         → Nearby requests
```

### 🔍 Donor Search & Matching (8 endpoints)
```
GET     /donors/search           → Search donors (blood group, location)
GET     /donors/:id              → Specific donor profile
GET     /donors/compatible       → Compatible donors
POST    /donors/contact          → Contact donor
GET     /donors/favorites        → Favorite donors
POST    /donors/add-favorite     → Add to favorites
DELETE  /donors/remove-favorite  → Remove from favorites
GET     /donors/nearby           → Nearby donors
```

### 📊 Dashboard & Statistics (5 endpoints)
```
GET     /dashboard/stats         → Dashboard statistics
GET     /dashboard/recent-requests → Recent requests
GET     /dashboard/emergency-banner → Emergency banner info
GET     /analytics/donation-trends → Donation trends data
GET     /analytics/regional-stats → Regional statistics
```

### 🩸 Donation History (6 endpoints)
```
GET     /donations/history       → Donation history (with filters)
POST    /donations/record        → Record new donation
GET     /donations/summary       → Donation summary
GET     /donations/next-eligible → Next eligible donation date
POST    /donations/export        → Export history PDF
PUT     /donations/:id/feedback  → Donation feedback
```

### 🔔 Notifications (6 endpoints)
```
GET     /notifications           → Get notifications
POST    /notifications/mark-read → Mark as read
DELETE  /notifications/:id       → Delete notification
POST    /notifications/bulk-action → Bulk actions
GET     /notifications/unread-count → Unread count
POST    /notifications/subscribe → Subscribe push notifications
```

### 📍 Location & Geography (4 endpoints)
```
GET     /locations/districts     → Districts list
GET     /locations/hospitals     → Hospitals list
GET     /locations/nearby        → Nearby locations
POST    /locations/geocode       → Address to coordinates
```

### 💬 Communication (4 endpoints)
```
POST    /messages/send           → Send message to donor
GET     /messages/conversations  → Conversations list
GET     /messages/:conversationId → Specific conversation
POST    /calls/initiate          → Call logging
```

### 🏆 Achievements & Rewards (3 endpoints)
```
GET     /achievements            → Achievement system
POST    /achievements/unlock     → Unlock achievement
GET     /leaderboard             → Top donors leaderboard
```

### ⚙️ System & Configuration (5 endpoints)
```
GET     /config/app-settings     → App configuration
GET     /config/blood-types      → Blood groups list
GET     /config/urgency-levels   → Urgency levels
POST    /feedback                → Send feedback
GET     /terms-and-conditions    → Terms and conditions
```

### 📱 Mobile Specific (2 endpoints)
```
POST    /device/register         → Register device token
PUT     /device/update-location  → Update location
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/your-repo/bloodcare-api.git
cd bloodcare-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and copy from `.env.example`:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/bloodcare_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Server Configuration
PORT=3000
NODE_ENV=development

# Email Configuration (for OTP and notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
bloodcare-api/
├── models/           # MongoDB models
│   ├── User.js
│   ├── BloodRequest.js
│   ├── Donation.js
│   ├── Notification.js
│   ├── Message.js
│   └── Achievement.js
├── controllers/      # Route controllers
│   ├── authController.js
│   ├── userController.js
│   └── ...
├── middleware/       # Custom middleware
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
├── routes/           # Route definitions
├── utils/            # Utility functions
│   ├── email.js
│   └── otp.js
├── config/           # Configuration files
│   └── database.js
├── logs/             # Log files
├── .env.example      # Environment variables template
├── package.json
└── app.js           # Main application file
```

## 🔧 API Usage Examples

### Authentication
```bash
# Register new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "01712345678",
    "password": "SecurePass123",
    "dateOfBirth": "1995-01-15",
    "gender": "male",
    "bloodGroup": "A+",
    "location": {
      "district": "Dhaka",
      "address": "Dhanmondi, Dhaka"
    }
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Protected Routes
```bash
# Get user profile (requires authentication)
curl -X GET http://localhost:3000/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create blood request
curl -X POST http://localhost:3000/requests/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Urgent B+ Blood Needed",
    "patientName": "Jane Smith",
    "patientAge": 35,
    "patientGender": "female",
    "bloodGroup": "B+",
    "unitsNeeded": 2,
    "urgencyLevel": "high",
    "hospitalName": "Dhaka Medical College Hospital",
    "location": {
      "district": "Dhaka",
      "address": "Shahbag, Dhaka"
    },
    "contactPerson": {
      "name": "John Doe",
      "phone": "01712345678"
    },
    "neededBy": "2024-12-25T10:00:00Z"
  }'
```

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "value": ""
    }
  ]
}
```

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** to get access and refresh tokens
2. **Include** access token in `Authorization` header: `Bearer YOUR_TOKEN`
3. **Refresh** tokens when they expire using `/auth/refresh-token`

### Token Expiration
- Access Token: 7 days (configurable)
- Refresh Token: 30 days (configurable)

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Auth Rate Limiting**: 5 login attempts per 15 minutes per IP
- **Account Lockout**: Account locked after 5 failed login attempts
- **Input Validation**: All inputs validated and sanitized
- **CORS Protection**: Configurable CORS origins
- **Security Headers**: Helmet.js security headers

## 📝 Validation Rules

### User Registration
- Name: 2-100 characters, letters and spaces only
- Email: Valid email format
- Phone: Valid Bangladeshi phone number (01xxxxxxxxx)
- Password: Minimum 6 characters with uppercase, lowercase, and number
- Age: Between 16-70 years
- Blood Group: Valid blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)

### Blood Requests
- Title: 10-200 characters
- Patient Age: 0-150 years
- Units Needed: 1-10 units
- Hospital Name: Required
- Contact Phone: Valid phone number
- Needed By: Future date

## 🚨 Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: 400 Bad Request
- **Authentication Errors**: 401 Unauthorized
- **Authorization Errors**: 403 Forbidden
- **Not Found Errors**: 404 Not Found
- **Rate Limit Errors**: 429 Too Many Requests
- **Server Errors**: 500 Internal Server Error

## 📊 Monitoring & Logging

- **Request Logging**: All requests logged with timing and user info
- **Error Logging**: Detailed error logs with stack traces
- **Health Check**: `/health` endpoint for monitoring
- **Winston Logger**: Structured logging to files and console

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@bloodcare.app
- 📞 Phone: +880 1712-345678
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/bloodcare-api/issues)

## 🙏 Acknowledgments

- Blood donation community in Bangladesh
- Open source libraries and contributors
- Healthcare professionals who provided insights

---

**Made with ❤️ for saving lives through technology**