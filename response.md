# BloodCare API - Request & Response Documentation 🩸

এই ফাইলে সমস্ত API endpoints এর request format এবং expected response format বিস্তারিতভাবে দেওয়া আছে।

## 📋 General Response Format

### Success Response Structure
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data varies by endpoint
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Error Response Structure
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "value": "submitted_value"
    }
  ]
}
```

## 🔐 Authentication & User Management

### POST /auth/register
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "01712345678",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "dateOfBirth": "1995-01-15",
  "gender": "male",
  "bloodGroup": "A+",
  "location": {
    "district": "Dhaka",
    "upazila": "Dhanmondi",
    "address": "House 123, Road 45, Dhanmondi"
  },
  "isDonor": true,
  "weight": 70
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your phone number.",
  "data": {
    "user": {
      "_id": "60f8b8b8b8b8b8b8b8b8b8b8",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "01712345678",
      "bloodGroup": "A+",
      "location": {
        "district": "Dhaka",
        "upazila": "Dhanmondi",
        "address": "House 123, Road 45, Dhanmondi"
      },
      "isDonor": true,
      "isAvailable": true,
      "isVerified": false,
      "totalDonations": 0,
      "age": 29,
      "createdAt": "2024-01-20T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### POST /auth/login
**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```
অথবা
```json
{
  "phone": "01712345678",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "60f8b8b8b8b8b8b8b8b8b8b8",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "01712345678",
      "bloodGroup": "A+",
      "isAvailable": true,
      "lastLogin": "2024-01-20T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### POST /auth/logout
**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /auth/refresh-token
**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### POST /auth/forgot-password
**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### POST /auth/reset-password/:token
**Request:**
```json
{
  "password": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### POST /auth/verify-otp
**Request:**
```json
{
  "phone": "01712345678",
  "otp": "123456",
  "type": "phone"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "phoneVerified": true,
    "emailVerified": false,
    "isVerified": false
  }
}
```

## 👤 User Profile Management

### GET /user/profile
**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "_id": "60f8b8b8b8b8b8b8b8b8b8b8",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "01712345678",
    "bloodGroup": "A+",
    "location": {
      "district": "Dhaka",
      "upazila": "Dhanmondi",
      "address": "House 123, Road 45, Dhanmondi"
    },
    "isDonor": true,
    "isAvailable": true,
    "totalDonations": 5,
    "lifeSaved": 15,
    "rating": 4.8,
    "age": 29,
    "nextEligibleDate": "2024-03-15T00:00:00.000Z",
    "avatar": {
      "local": {
        "url": "http://localhost:3000/assets/profileimage/avatar-1705741800000.jpg"
      },
      "cloudinary": {
        "url": "https://res.cloudinary.com/bloodcare/image/upload/v1705741800/bloodcare/profileimages/profile-1705741800.jpg"
      }
    }
  }
}
```

### PUT /user/profile
**Headers:**
```
Authorization: Bearer your_access_token
```

**Request:**
```json
{
  "name": "John Smith",
  "phone": "01787654321",
  "location": {
    "district": "Chittagong",
    "upazila": "Panchlaish",
    "address": "New Address"
  },
  "weight": 75,
  "isAvailable": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "60f8b8b8b8b8b8b8b8b8b8b8",
    "name": "John Smith",
    "phone": "01787654321",
    "location": {
      "district": "Chittagong",
      "upazila": "Panchlaish",
      "address": "New Address"
    },
    "weight": 75,
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### POST /user/upload-avatar
**Headers:**
```
Authorization: Bearer your_access_token
Content-Type: multipart/form-data
```

**Request:**
Form Data:
- `avatar`: Image file (JPEG, PNG, WebP)

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "fileInfo": {
      "local": {
        "filename": "avatar-1705741800000-123456789.jpg",
        "path": "assets/profileimage/avatar-1705741800000-123456789.jpg",
        "url": "http://localhost:3000/assets/profileimage/avatar-1705741800000-123456789.jpg"
      },
      "cloudinary": {
        "public_id": "profile-1705741800",
        "url": "https://res.cloudinary.com/bloodcare/image/upload/v1705741800/bloodcare/profileimages/profile-1705741800.jpg",
        "format": "jpg"
      }
    },
    "uploadStrategy": "both",
    "availableUrls": {
      "local": "http://localhost:3000/assets/profileimage/avatar-1705741800000-123456789.jpg",
      "cloudinary": "https://res.cloudinary.com/bloodcare/image/upload/v1705741800/bloodcare/profileimages/profile-1705741800.jpg"
    },
    "primaryUrl": "https://res.cloudinary.com/bloodcare/image/upload/v1705741800/bloodcare/profileimages/profile-1705741800.jpg"
  }
}
```

## 🩸 Blood Request Management

### POST /requests/create
**Headers:**
```
Authorization: Bearer your_access_token
```

**Request:**
```json
{
  "title": "Urgent A+ Blood Needed for Surgery",
  "description": "Patient needs blood for emergency surgery",
  "patientName": "Jane Smith",
  "patientAge": 35,
  "patientGender": "female",
  "bloodGroup": "A+",
  "unitsNeeded": 3,
  "urgencyLevel": "high",
  "medicalCondition": "Accident trauma, internal bleeding",
  "hospitalName": "Dhaka Medical College Hospital",
  "doctorName": "Dr. Rahman",
  "location": {
    "district": "Dhaka",
    "upazila": "Shahbag",
    "address": "Shahbag, Dhaka Medical College Hospital"
  },
  "contactPerson": {
    "name": "John Doe",
    "phone": "01712345678",
    "relationship": "family"
  },
  "neededBy": "2024-01-21T08:00:00.000Z",
  "isEmergency": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blood request created successfully",
  "data": {
    "_id": "60f8b8b8b8b8b8b8b8b8b8b9",
    "title": "Urgent A+ Blood Needed for Surgery",
    "patientName": "Jane Smith",
    "bloodGroup": "A+",
    "unitsNeeded": 3,
    "urgencyLevel": "high",
    "hospitalName": "Dhaka Medical College Hospital",
    "location": {
      "district": "Dhaka",
      "address": "Shahbag, Dhaka Medical College Hospital"
    },
    "contactPerson": {
      "name": "John Doe",
      "phone": "01712345678"
    },
    "neededBy": "2024-01-21T08:00:00.000Z",
    "isEmergency": true,
    "status": "active",
    "requestedBy": "60f8b8b8b8b8b8b8b8b8b8b8",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "timeRemaining": "21 hours",
    "isUrgent": true
  }
}
```

### GET /requests
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `bloodGroup` (optional): Filter by blood group
- `district` (optional): Filter by district
- `urgency` (optional): Filter by urgency level
- `status` (optional): Filter by status

**Request:**
```
GET /requests?page=1&limit=10&bloodGroup=A%2B&district=Dhaka&urgency=high
```

**Response:**
```json
{
  "success": true,
  "message": "Blood requests retrieved successfully",
  "data": {
    "requests": [
      {
        "_id": "60f8b8b8b8b8b8b8b8b8b8b9",
        "title": "Urgent A+ Blood Needed for Surgery",
        "bloodGroup": "A+",
        "unitsNeeded": 3,
        "unitsFulfilled": 1,
        "urgencyLevel": "high",
        "hospitalName": "Dhaka Medical College Hospital",
        "location": {
          "district": "Dhaka"
        },
        "neededBy": "2024-01-21T08:00:00.000Z",
        "isEmergency": true,
        "timeRemaining": "21 hours",
        "completionPercentage": 33,
        "requestedBy": {
          "_id": "60f8b8b8b8b8b8b8b8b8b8b8",
          "name": "John Doe"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRequests": 45,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "bloodGroup": "A+",
      "district": "Dhaka",
      "urgency": "high"
    }
  }
}
```

### GET /requests/:id
**Headers:**
```
Authorization: Bearer your_access_token (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Blood request details retrieved successfully",
  "data": {
    "_id": "60f8b8b8b8b8b8b8b8b8b8b9",
    "title": "Urgent A+ Blood Needed for Surgery",
    "description": "Patient needs blood for emergency surgery",
    "patientName": "Jane Smith",
    "patientAge": 35,
    "patientGender": "female",
    "bloodGroup": "A+",
    "unitsNeeded": 3,
    "unitsFulfilled": 1,
    "urgencyLevel": "high",
    "hospitalName": "Dhaka Medical College Hospital",
    "doctorName": "Dr. Rahman",
    "location": {
      "district": "Dhaka",
      "address": "Shahbag, Dhaka Medical College Hospital"
    },
    "contactPerson": {
      "name": "John Doe",
      "phone": "01712345678",
      "relationship": "family"
    },
    "neededBy": "2024-01-21T08:00:00.000Z",
    "responses": [
      {
        "_id": "60f8b8b8b8b8b8b8b8b8b8ba",
        "donor": {
          "_id": "60f8b8b8b8b8b8b8b8b8b8bb",
          "name": "Alice Brown",
          "bloodGroup": "A+",
          "rating": 4.9
        },
        "message": "I can donate 1 unit tomorrow morning",
        "status": "accepted",
        "unitsPromised": 1,
        "responseDate": "2024-01-20T11:00:00.000Z"
      }
    ],
    "requestedBy": {
      "_id": "60f8b8b8b8b8b8b8b8b8b8b8",
      "name": "John Doe",
      "phone": "01712345678"
    },
    "viewCount": 25,
    "timeRemaining": "21 hours",
    "completionPercentage": 33,
    "canRespond": true
  }
}
```

## 🔍 Donor Search & Matching

### GET /donors/search
**Query Parameters:**
- `bloodGroup` (required): Blood group to search
- `district` (optional): District filter
- `page` (optional): Page number
- `limit` (optional): Items per page
- `lat` (optional): Latitude for distance calculation
- `lng` (optional): Longitude for distance calculation

**Request:**
```
GET /donors/search?bloodGroup=A%2B&district=Dhaka&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Donors found successfully",
  "data": {
    "donors": [
      {
        "_id": "60f8b8b8b8b8b8b8b8b8b8bb",
        "name": "Alice Brown",
        "bloodGroup": "A+",
        "location": {
          "district": "Dhaka",
          "upazila": "Dhanmondi"
        },
        "isAvailable": true,
        "totalDonations": 8,
        "rating": 4.9,
        "age": 28,
        "lastDonationDate": "2023-11-15T00:00:00.000Z",
        "nextEligibleDate": "2024-03-15T00:00:00.000Z",
        "avatar": {
          "url": "https://res.cloudinary.com/bloodcare/image/upload/v1705741800/bloodcare/profileimages/profile-1705741800.jpg"
        },
        "distance": "2.5 km",
        "isEligible": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalDonors": 28,
      "hasNext": true,
      "hasPrev": false
    },
    "searchCriteria": {
      "bloodGroup": "A+",
      "district": "Dhaka"
    }
  }
}
```

## 📊 Dashboard & Statistics

### GET /dashboard/stats
**Headers:**
```
Authorization: Bearer your_access_token (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "overview": {
      "totalDonors": 15420,
      "activeDonors": 8950,
      "totalRequests": 2340,
      "activeRequests": 145,
      "emergencyRequests": 23,
      "bloodUnitsCollected": 45680,
      "livesaved": 18720
    },
    "userStats": {
      "myDonations": 5,
      "myRequests": 2,
      "pointsEarned": 250,
      "badgesUnlocked": 3,
      "nextEligibleDate": "2024-03-15T00:00:00.000Z"
    },
    "bloodGroupDistribution": {
      "A+": 2840,
      "O+": 3120,
      "B+": 2650,
      "AB+": 890,
      "A-": 450,
      "O-": 380,
      "B-": 420,
      "AB-": 120
    },
    "recentActivity": [
      {
        "type": "donation",
        "message": "Blood donated at Dhaka Medical College",
        "date": "2024-01-19T14:30:00.000Z"
      },
      {
        "type": "request_fulfilled",
        "message": "Your blood request was fulfilled",
        "date": "2024-01-18T09:15:00.000Z"
      }
    ]
  }
}
```

## 🔔 Notifications

### GET /notifications
**Headers:**
```
Authorization: Bearer your_access_token
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Filter by notification type
- `isRead` (optional): Filter by read status

**Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "_id": "60f8b8b8b8b8b8b8b8b8b8bc",
        "title": "Blood Request Match Found",
        "message": "A blood request matching your blood group was posted in your area",
        "type": "blood_request",
        "priority": "high",
        "isRead": false,
        "actionRequired": true,
        "actionType": "view",
        "actionUrl": "/requests/60f8b8b8b8b8b8b8b8b8b8b9",
        "relatedId": "60f8b8b8b8b8b8b8b8b8b8b9",
        "createdAt": "2024-01-20T10:30:00.000Z",
        "timeAgo": "2h ago"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 4,
      "totalNotifications": 38,
      "unreadCount": 5
    }
  }
}
```

### POST /notifications/mark-read
**Headers:**
```
Authorization: Bearer your_access_token
```

**Request:**
```json
{
  "notificationIds": ["60f8b8b8b8b8b8b8b8b8b8bc"],
  "markAll": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications marked as read",
  "data": {
    "markedCount": 1,
    "remainingUnread": 4
  }
}
```

## 📍 Location & Geography

### GET /locations/districts
**Response:**
```json
{
  "success": true,
  "message": "Districts retrieved successfully",
  "data": [
    "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", 
    "Sylhet", "Rangpur", "Mymensingh", "Comilla", "Feni"
  ]
}
```

### GET /config/blood-types
**Response:**
```json
{
  "success": true,
  "message": "Blood types retrieved successfully",
  "data": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
}
```

### GET /config/urgency-levels
**Response:**
```json
{
  "success": true,
  "message": "Urgency levels retrieved successfully",
  "data": [
    { "value": "low", "label": "Low", "color": "#28a745" },
    { "value": "medium", "label": "Medium", "color": "#ffc107" },
    { "value": "high", "label": "High", "color": "#fd7e14" },
    { "value": "critical", "label": "Critical", "color": "#dc3545" }
  ]
}
```

## ❌ Common Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long",
      "value": "123"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "You do not have permission to perform this action."
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later.",
  "error": "RATE_LIMIT_EXCEEDED"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
```

## 📝 Notes

1. **Authorization Header**: Protected endpoints require `Authorization: Bearer <token>` header
2. **Content-Type**: Use `application/json` for JSON requests
3. **File Uploads**: Use `multipart/form-data` for file upload endpoints
4. **Date Format**: All dates are in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
5. **Pagination**: Most list endpoints support `page` and `limit` query parameters
6. **Phone Numbers**: Must be valid Bangladeshi format (01xxxxxxxxx)
7. **Blood Groups**: Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-

## 🔗 Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com/api`