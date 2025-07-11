# BloodCare API - Koyeb Deployment Guide 🚀

এই গাইডে আপনি Koyeb platform এ BloodCare API deploy করার সম্পূর্ণ প্রক্রিয়া শিখবেন।

## 🌟 Koyeb কেন বেছে নিবেন?

- ✅ **Free Tier**: মাসিক $5.50 free credit
- ✅ **Global Edge Network**: দ্রুত response time
- ✅ **Auto Scaling**: Traffic অনুযায়ী automatic scaling
- ✅ **Git Integration**: GitHub থেকে direct deploy
- ✅ **Custom Domain**: Free SSL certificate সহ
- ✅ **Database Support**: MongoDB Atlas integration
- ✅ **Environment Variables**: Secure config management

## 📋 Pre-requisites

1. **GitHub Repository** - আপনার BloodCare API code GitHub এ থাকতে হবে
2. **MongoDB Atlas Account** - Free cluster তৈরি করুন
3. **Koyeb Account** - [koyeb.com](https://www.koyeb.com) এ signup করুন
4. **Cloudinary Account** (Optional) - Image upload এর জন্য

## 🗃️ Step 1: MongoDB Atlas Setup

### 1.1 MongoDB Atlas Cluster তৈরি

```bash
# MongoDB Atlas এ যান: https://cloud.mongodb.com
# 1. Account তৈরি করুন বা login করুন
# 2. "Create a New Cluster" ক্লিক করুন
# 3. FREE tier (M0) বেছে নিন
# 4. Region: Singapore বা Mumbai (দ্রুত connection এর জন্য)
# 5. Cluster name: bloodcare-cluster
```

### 1.2 Database User তৈরি

```bash
# Database Access > Add New Database User
# Username: bloodcare-user
# Password: একটা strong password তৈরি করুন
# Database User Privileges: Read and write to any database
```

### 1.3 Network Access Setup

```bash
# Network Access > Add IP Address
# Access List Entry: 0.0.0.0/0 (Allow access from anywhere)
# Comment: Koyeb deployment
```

### 1.4 Connection String তৈরি

```bash
# Connect > Connect your application
# Driver: Node.js, Version: 4.1 or later
# Connection string copy করুন:

mongodb+srv://bloodcare-user:<password>@bloodcare-cluster.xxxxx.mongodb.net/bloodcare_db?retryWrites=true&w=majority
```

## 🐙 Step 2: GitHub Repository Preparation

### 2.1 Code Upload

```bash
# Local repo তৈরি করুন
git init
git add .
git commit -m "Initial BloodCare API commit"

# GitHub এ repository তৈরি করুন
git remote add origin https://github.com/yourusername/bloodcare-api.git
git branch -M main
git push -u origin main
```

### 2.2 Production Ready Files

**package.json এ scripts add করুন:**
```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "build": "echo 'No build process needed'",
    "test": "jest"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

**Procfile তৈরি করুন (optional):**
```
web: node app.js
```

## 🚀 Step 3: Koyeb Deployment

### 3.1 Koyeb Account Setup

1. [koyeb.com](https://www.koyeb.com) এ যান
2. GitHub দিয়ে signup করুন
3. Email verify করুন

### 3.2 New Service তৈরি

```bash
# Koyeb Dashboard > Create Service
# 1. Select GitHub repository
# 2. Repository: bloodcare-api
# 3. Branch: main
# 4. Build configuration: Auto-detect (Node.js)
```

### 3.3 Environment Variables Setup

Koyeb dashboard এ Environment Variables section এ যান:

```bash
# Database Configuration
MONGO_URI=mongodb+srv://bloodcare-user:your_password@bloodcare-cluster.xxxxx.mongodb.net/bloodcare_db?retryWrites=true&w=majority

# JWT Configuration  
JWT_SECRET=koyeb_production_super_secret_jwt_key_2024
JWT_REFRESH_SECRET=koyeb_production_refresh_token_secret_2024
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Server Configuration
PORT=8000
NODE_ENV=production

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_STRATEGY=cloudinary
SAVE_LOCAL=false
SAVE_CLOUDINARY=true
FILE_URL_PRIORITY=cloudinary

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com,https://bloodcare-app.vercel.app

# Other
MAINTENANCE_MODE=false
```

### 3.4 Service Configuration

```bash
# Service Configuration:
# - Name: bloodcare-api
# - Region: fra (Frankfurt) or sin (Singapore)
# - Instance Type: eco (Free tier)
# - Auto-deploy: Enable
# - Health check: /health
```

### 3.5 Deploy করুন

```bash
# "Deploy" button ক্লিক করুন
# Build process monitor করুন
# Deployment logs check করুন
```

## ⚙️ Step 3.6: Koyeb Builder Configuration & Port Setup

Koyeb এ deploy করার সময় নিচের configuration follow করুন:

- **Builder:** Buildpack (default)
- **Build command:** (ফাঁকা রাখুন, unless custom build দরকার)
- **Run command:** (ফাঁকা রাখুন, unless custom run দরকার)
- **Work directory:** (ফাঁকা রাখুন, যদি root এ code থাকে)
- **Exposed port:**
  - Environment variable এ `PORT=8000` দিন
  - App টি অবশ্যই port 8000-এ listen করতে হবে
- **Health check:**
  - `/health` endpoint ensure করুন (এই project-এ আছে)
  - Koyeb TCP health check port 8000-এ হবে

#### Example Environment Variables
```env
PORT=8000
MONGO_URI=your_mongodb_uri
MONGO_DB_NAME=your_db_name
NODE_ENV=production
```

#### Example package.json scripts
```json
"scripts": {
  "start": "node app.js"
}
```

---

## 🛠️ Step 5: Troubleshooting Common Koyeb Errors

- **error: UNCAUGHT EXCEPTION! 💥 Shutting down...**
- **error: ReferenceError**
- **Application exited with code 1**

**সম্ভাব্য কারণ ও সমাধান:**

1. **Environment variable ঠিকমতো set হয়নি:**
   - Koyeb dashboard এ সব env variable ঠিকমতো add হয়েছে কিনা check করুন (বিশেষ করে MONGO_URI, PORT, JWT_SECRET ইত্যাদি)।
2. **PORT mismatch:**
   - App টি অবশ্যই process.env.PORT (মানে 8000) এ listen করতে হবে।
   - Example:
     ```js
     const PORT = process.env.PORT || 8000;
     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
     ```
3. **Database connection error:**
   - MONGO_URI, MONGO_DB_NAME ঠিক আছে কিনা check করুন।
   - User/pass, DB name, network access ঠিক আছে কিনা দেখুন।
4. **Code এ ReferenceError:**
   - Deployment log এ error details দেখুন।
   - কোন variable undefined, সেটা fix করুন।
5. **Start command ভুল:**
   - package.json এ "start": "node app.js" আছে কিনা দেখুন।

---

**Deploy error হলে Koyeb log details দেখে error message Google করুন বা এখানে paste করুন।**

## 🔧 Step 4: Post-Deployment Configuration

### 4.1 Custom Domain Setup (Optional)

```bash
# Koyeb Dashboard > Domains
# 1. Add Domain
# 2. Domain: api.bloodcare.app (your domain)
# 3. Add CNAME record: 
#    CNAME api -> your-app-name.koyeb.app
```

### 4.2 SSL Certificate

```bash
# Automatic SSL certificate তৈরি হবে
# Let's Encrypt certificate (Free)
# Auto-renewal enabled
```

### 4.3 API Testing

```bash
# Health check
curl https://your-app-name.koyeb.app/health

# Test endpoints
curl -X POST https://your-app-name.koyeb.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "01712345678",
    "password": "TestPass123",
    "confirmPassword": "TestPass123",
    "dateOfBirth": "1995-01-15",
    "gender": "male",
    "bloodGroup": "A+",
    "location": {
      "district": "Dhaka",
      "address": "Test Address"
    }
  }'
```

## 📊 Step 5: Monitoring & Maintenance

### 5.1 Koyeb Dashboard Monitoring

```bash
# Metrics যা monitor করবেন:
# - CPU Usage
# - Memory Usage  
# - Request Rate
# - Response Time
# - Error Rate
# - Build Status
```

### 5.2 Application Logs

```bash
# Koyeb Dashboard > Logs section
# Real-time logs দেখুন
# Error tracking করুন
# Performance analyze করুন
```

### 5.3 Auto-scaling Setup

```bash
# Koyeb automatically scales based on:
# - CPU usage
# - Memory usage
# - Request volume
# - Response time
```

## 🔄 Step 6: CI/CD Pipeline

### 6.1 GitHub Actions (Optional)

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Koyeb

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Koyeb
      run: echo "Koyeb auto-deploys from GitHub"
```

### 6.2 Automatic Deployment

```bash
# Koyeb automatically deploys when:
# 1. Code push হয় main branch এ
# 2. Environment variables change হয়
# 3. Manual redeploy করা হয়
```

## 🛡️ Step 7: Security Best Practices

### 7.1 Environment Variables Security

```bash
# Secret values কখনো code এ hardcode করবেন না
# Production এ strong JWT secrets ব্যবহার করুন
# Database credentials secure রাখুন
# API keys rotate করুন regularly
```

### 7.2 Database Security

```bash
# MongoDB Atlas এ:
# - IP whitelist properly configure করুন
# - Strong password ব্যবহার করুন
# - Regular backup enable করুন
# - Read-only users create করুন analytics এর জন্য
```

### 7.3 CORS Configuration

```bash
# Production এ specific domains allow করুন
CORS_ORIGIN=https://bloodcare-app.vercel.app,https://admin.bloodcare.app

# Wildcard (*) avoid করুন production এ
```

## 📈 Step 8: Performance Optimization

### 8.1 Database Optimization

```bash
# MongoDB Atlas এ:
# - Proper indexing setup করুন
# - Query performance monitor করুন
# - Connection pooling optimize করুন
```

### 8.2 API Response Optimization

```bash
# Compression enable করুন (already configured)
# Response caching implement করুন
# Image optimization করুন Cloudinary দিয়ে
# Pagination properly implement করুন
```

### 8.3 Monitoring Setup

```bash
# Third-party monitoring tools:
# - Uptime Robot (Free)
# - New Relic (Free tier)
# - Sentry (Error tracking)
```

## 💰 Step 9: Cost Management

### 9.1 Koyeb Free Tier Limits

```bash
# Free Credits: $5.50/month
# Instance Types: eco (shared)
# Sleep Mode: after 30 minutes inactivity
# Build Time: included
# Bandwidth: 100GB/month
```

### 9.2 Optimization Tips

```bash
# Cost optimize করতে:
# 1. Efficient database queries লিখুন
# 2. Response caching use করুন
# 3. Image compression করুন
# 4. Unnecessary API calls avoid করুন
```

## 🚨 Step 10: Troubleshooting

### 10.1 Common Issues

**Build Failure:**
```bash
# Check package.json dependencies
# Verify Node.js version compatibility
# Check build logs in Koyeb dashboard
```

**Database Connection Error:**
```bash
# Verify MongoDB Atlas connection string
# Check network access settings
# Verify username/password
```

**Environment Variables Not Working:**
```bash
# Check variable names (case-sensitive)
# Verify values (no quotes needed)
# Restart service after changes
```

### 10.2 Debug Commands

```bash
# Service logs দেখুন
# Health check endpoint test করুন
# Database connection manually test করুন
```

## 📞 Support & Resources

### Documentation Links
- [Koyeb Documentation](https://www.koyeb.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides)

### Community Support
- [Koyeb Discord](https://discord.gg/koyeb)
- [MongoDB Community](https://community.mongodb.com)
- [Node.js Community](https://nodejs.org/en/community)

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster তৈরি ও configure
- [ ] GitHub repository setup ও code push
- [ ] Koyeb service তৈরি
- [ ] Environment variables properly set
- [ ] Domain configuration (if needed)
- [ ] SSL certificate setup
- [ ] API endpoints testing
- [ ] Monitoring setup
- [ ] Security configuration review
- [ ] Performance optimization
- [ ] Documentation update

---

🎉 **Congratulations!** আপনার BloodCare API এখন Koyeb এ live! এখন Flutter app develop করতে পারেন এই API ব্যবহার করে।

**Live API URL:** `https://your-app-name.koyeb.app`

**Next Steps:**
1. Frontend application develop করুন
2. Mobile app testing করুন
3. User feedback collect করুন
4. Features iterate করুন