# BloodCare API - Complete Documentation 🩸

## 📖 Overview

BloodCare API is a comprehensive RESTful API designed for blood donation and management systems. Built with Node.js, Express, and MongoDB, it provides 60+ endpoints with modern security features, real-time capabilities, and scalable architecture.

## 🔗 Base URLs

- **Development**: `http://localhost:3000`
- **Production**: `https://your-app-name.koyeb.app`
- **Staging**: `https://staging-bloodcare.koyeb.app`

## 🔐 Authentication

BloodCare API uses JWT (JSON Web Tokens) for authentication with a dual-token system:

- **Access Token**: Short-lived (7 days), used for API requests
- **Refresh Token**: Long-lived (30 days), used to generate new access tokens

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
API-Version: v1
X-Request-ID: <unique_request_id>
```

## 🛡️ Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **File Uploads**: 10 uploads per 15 minutes
- **Password Reset**: 3 attempts per hour

### Security Headers
- **HSTS**: HTTP Strict Transport Security
- **CSP**: Content Security Policy
- **X-Frame-Options**: Clickjacking protection
- **X-XSS-Protection**: XSS attack prevention
- **Input Sanitization**: NoSQL injection and XSS cleaning

### Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **Data Encryption**: AES-256 for sensitive data
- **Input Validation**: Comprehensive validation on all endpoints
- **IP Filtering**: Blacklist/whitelist support

## 📁 API Structure

### 🔐 Authentication & User Management
```
POST   /auth/register           - User registration
POST   /auth/login              - User login
POST   /auth/logout             - User logout
POST   /auth/refresh-token      - Refresh access token
POST   /auth/forgot-password    - Initiate password reset
POST   /auth/reset-password/:token - Reset password
POST   /auth/verify-otp         - Verify OTP
POST   /auth/change-password    - Change password
```

### 👤 User Profile Management
```
GET    /user/profile            - Get user profile
PUT    /user/profile            - Update user profile
POST   /user/upload-avatar      - Upload profile picture
GET    /user/stats              - Get user statistics
PUT    /user/availability       - Toggle donor availability
GET    /user/achievements       - Get user achievements
PUT    /user/settings           - Update user settings
DELETE /user/account            - Delete user account
```

### 🩸 Blood Request Management
```
POST   /requests/create         - Create blood request
GET    /requests                - Get all blood requests
GET    /requests/emergency      - Get emergency requests
GET    /requests/my-requests    - Get user's requests
GET    /requests/nearby         - Get nearby requests
GET    /requests/:id            - Get specific request
PUT    /requests/:id            - Update blood request
DELETE /requests/:id            - Delete blood request
POST   /requests/:id/respond    - Respond to request
```

### 🔍 Donor Search & Matching
```
GET    /donors/search           - Search for donors
GET    /donors/compatible       - Get compatible donors
GET    /donors/nearby           - Get nearby donors
GET    /donors/favorites        - Get favorite donors
POST   /donors/add-favorite     - Add donor to favorites
DELETE /donors/remove-favorite  - Remove from favorites
GET    /donors/:id              - Get donor profile
POST   /donors/contact          - Contact donor
```

### 📊 Dashboard & Statistics
```
GET    /dashboard/stats         - Get dashboard statistics
GET    /dashboard/recent-requests - Get recent requests
GET    /dashboard/emergency-banner - Get emergency banner
GET    /analytics/donation-trends - Get donation trends
GET    /analytics/regional-stats - Get regional statistics
```

### 🩸 Donation History
```
GET    /donations/history       - Get donation history
POST   /donations/record        - Record new donation
GET    /donations/summary       - Get donation summary
GET    /donations/next-eligible - Get next eligible date
POST   /donations/export        - Export donation history
PUT    /donations/:id/feedback  - Add donation feedback
```

### 🔔 Notifications
```
GET    /notifications           - Get notifications
POST   /notifications/mark-read - Mark as read
DELETE /notifications/:id       - Delete notification
POST   /notifications/bulk-action - Bulk actions
GET    /notifications/unread-count - Get unread count
POST   /notifications/subscribe - Subscribe to push notifications
```

### 📍 Location & Geography
```
GET    /locations/districts     - Get Bangladesh districts
GET    /locations/hospitals     - Get hospitals list
GET    /locations/nearby        - Get nearby locations
POST   /locations/geocode       - Geocode address
```

### 💬 Communication
```
POST   /messages/send           - Send message
GET    /messages/conversations  - Get conversations
GET    /messages/:conversationId - Get conversation messages
POST   /calls/initiate          - Initiate call log
```

### 🏆 Achievements & Rewards
```
GET    /achievements            - Get achievements
POST   /achievements/unlock     - Unlock achievement
GET    /leaderboard             - Get leaderboard
```

### ⚙️ System & Configuration
```
GET    /config/app-settings     - Get app settings
GET    /config/blood-types      - Get blood types
GET    /config/urgency-levels   - Get urgency levels
POST   /feedback                - Submit feedback
GET    /terms-and-conditions    - Get terms
```

### 📱 Mobile Specific
```
POST   /device/register         - Register device
PUT    /device/update-location  - Update device location
```

## 🔧 Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2024-01-20T10:30:00.000Z",
  "requestId": "req_1234567890abcdef"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "value": "submitted_value"
    }
  ],
  "requestId": "req_1234567890abcdef"
}
```

## 📝 Data Models

### User Model
```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string; // hashed
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  location: {
    district: string;
    upazila?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    }
  };
  isDonor: boolean;
  isAvailable: boolean;
  avatar?: {
    local?: FileInfo;
    cloudinary?: FileInfo;
  };
  totalDonations: number;
  rating: number;
  isVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  lastDonationDate?: Date;
  nextEligibleDate?: Date;
  weight?: number;
  height?: number;
  medicalConditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  achievements: ObjectId[];
  points: number;
  privacySettings: {
    showPhone: boolean;
    showEmail: boolean;
    showLocation: boolean;
  };
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    bloodRequestMatches: boolean;
    emergencyAlerts: boolean;
  };
  deviceTokens: string[];
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Blood Request Model
```typescript
interface BloodRequest {
  _id: ObjectId;
  title: string;
  description?: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female';
  bloodGroup: string;
  unitsNeeded: number;
  unitsFulfilled: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  medicalCondition?: string;
  hospitalName: string;
  doctorName?: string;
  location: {
    district: string;
    upazila?: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    }
  };
  contactPerson: {
    name: string;
    phone: string;
    relationship: 'self' | 'family' | 'friend' | 'other';
  };
  neededBy: Date;
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
  isEmergency: boolean;
  requestedBy: ObjectId;
  responses: Array<{
    donor: ObjectId;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected';
    unitsPromised: number;
    responseDate: Date;
  }>;
  viewCount: number;
  shareCount: number;
  tags?: string[];
  attachments?: FileInfo[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Donation Model
```typescript
interface Donation {
  _id: ObjectId;
  donor: ObjectId;
  recipient?: ObjectId;
  bloodRequest?: ObjectId;
  donationType: 'whole_blood' | 'plasma' | 'platelets' | 'double_red_cells';
  units: number;
  donationDate: Date;
  location: {
    type: 'hospital' | 'blood_bank' | 'mobile_unit';
    name: string;
    address: string;
  };
  medicalOfficer?: {
    name: string;
    license: string;
  };
  preScreening: {
    weight: number;
    bloodPressure: string;
    pulse: number;
    temperature: number;
    hemoglobin: number;
  };
  postDonation: {
    complications?: string;
    feedback?: string;
    rating?: number;
  };
  certificate?: FileInfo;
  status: 'scheduled' | 'completed' | 'cancelled';
  pointsEarned: number;
  nextEligibleDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 📊 File Upload

### Configuration
The API supports dual upload strategy:

```env
UPLOAD_STRATEGY=both          # local, cloudinary, both
SAVE_LOCAL=true              # Save to local storage
SAVE_CLOUDINARY=true         # Save to Cloudinary
FILE_URL_PRIORITY=cloudinary # Which URL to prioritize
```

### Upload Endpoints
```
POST /user/upload-avatar     # Profile pictures
POST /requests/upload-docs   # Request documents
POST /donations/upload-cert  # Donation certificates
```

### File Limits
- **Max file size**: 5MB
- **Allowed formats**: JPEG, PNG, WebP, PDF, DOC, DOCX
- **Rate limit**: 10 uploads per 15 minutes

## 🔍 Query Parameters

### Pagination
```
?page=1&limit=10             # Page number and items per page
```

### Filtering
```
?bloodGroup=A%2B             # Filter by blood group
?district=Dhaka              # Filter by district
?urgency=high                # Filter by urgency level
?status=active               # Filter by status
```

### Sorting
```
?sort=createdAt              # Sort by field
?order=desc                  # Sort order (asc/desc)
```

### Search
```
?search=urgent               # Text search
?lat=23.8103&lng=90.4125     # Location-based search
?radius=10                   # Search radius in km
```

## 🚨 Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |
| MAINTENANCE_MODE | 503 | Service unavailable |

## 📱 Flutter Integration

### HTTP Client Setup
```dart
import 'package:dio/dio.dart';

class ApiClient {
  static const String baseUrl = 'https://your-app-name.koyeb.app';
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: 30000,
    receiveTimeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'API-Version': 'v1',
    },
  ));
  
  // Add interceptors for auth, logging, etc.
  ApiClient() {
    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(LogInterceptor());
  }
}
```

### Authentication
```dart
class AuthService {
  Future<AuthResponse> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      
      return AuthResponse.fromJson(response.data);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
  
  Future<void> refreshToken() async {
    final refreshToken = await SecureStorage.getRefreshToken();
    // Refresh logic
  }
}
```

### Error Handling
```dart
class ApiException implements Exception {
  final String message;
  final String? errorCode;
  final int? statusCode;
  
  ApiException({
    required this.message,
    this.errorCode,
    this.statusCode,
  });
  
  static ApiException fromDioError(DioError error) {
    // Convert DioError to ApiException
  }
}
```

## 🧪 Testing

### Health Check
```bash
curl -X GET https://your-app-name.koyeb.app/health
```

### Authentication Test
```bash
curl -X POST https://your-app-name.koyeb.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### File Upload Test
```bash
curl -X POST https://your-app-name.koyeb.app/user/upload-avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@profile.jpg"
```

## 📈 Performance

### Response Times
- **Authentication**: < 200ms
- **Data queries**: < 500ms
- **File uploads**: < 2s (5MB)
- **Search operations**: < 1s

### Caching Strategy
- **Static data**: 24 hours (blood types, districts)
- **User profiles**: 1 hour
- **Search results**: 15 minutes
- **Statistics**: 30 minutes

### Database Optimization
- **Indexes**: On frequently queried fields
- **Aggregation**: For statistics and analytics
- **Connection pooling**: 10 connections per instance
- **Query optimization**: Lean queries and projections

## 🔒 Security Best Practices

### API Security
1. **Always use HTTPS** in production
2. **Validate all inputs** before processing
3. **Sanitize data** to prevent XSS/NoSQL injection
4. **Rate limit** all endpoints appropriately
5. **Use strong JWT secrets** and rotate regularly
6. **Implement proper CORS** configuration
7. **Log security events** for monitoring

### Client Security
1. **Store tokens securely** (encrypted storage)
2. **Implement token refresh** logic
3. **Validate SSL certificates**
4. **Use certificate pinning** for mobile apps
5. **Implement biometric authentication** when available

## 📚 SDK & Libraries

### Recommended Flutter Packages
```yaml
dependencies:
  dio: ^5.3.2                    # HTTP client
  flutter_secure_storage: ^9.0.0 # Secure storage
  cached_network_image: ^3.3.0   # Image caching
  image_picker: ^1.0.4           # File selection
  geolocator: ^10.1.0            # Location services
  firebase_messaging: ^14.7.9    # Push notifications
  hive: ^2.2.3                   # Local database
```

### Code Generation
```yaml
dev_dependencies:
  json_annotation: ^4.8.1
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
```

## 🚀 Deployment

### Environment Variables
```env
# Required
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_key
NODE_ENV=production

# Optional
CLOUDINARY_CLOUD_NAME=your_cloud_name
EMAIL_HOST=smtp.gmail.com
CORS_ORIGIN=https://your-frontend.com
```

### Health Monitoring
```bash
# Health check endpoint
GET /health

# Response format
{
  "success": true,
  "message": "BloodCare API is running!",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## 📞 Support

### Documentation
- **API Reference**: Complete endpoint documentation
- **Response Guide**: All request/response formats
- **Deployment Guide**: Koyeb deployment instructions

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time community support
- **Email**: Direct developer support

### Resources
- **Postman Collection**: Pre-configured API requests
- **Flutter Examples**: Sample implementation code
- **Video Tutorials**: Step-by-step guides

---

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

---

**Last Updated**: January 2024  
**API Version**: v1.0.0  
**Documentation Version**: 1.0.0