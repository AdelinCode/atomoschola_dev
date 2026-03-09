# EduPlatform

A collaborative educational platform built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- 📚 Multi-subject learning platform (Physics, Chemistry, Mathematics, Biology)
- 👥 Role-based user system (User, Creator, Editor, Owner)
- 🔍 Advanced search functionality
- ⭐ Lesson rating and bookmarking
- 📝 Rich text editor with LaTeX formula support
- 📎 File attachments from cloud storage
- 🎥 Video lesson support (YouTube integration)
- 📱 Responsive design

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5 & CSS3
- Quill.js (Rich text editor)
- KaTeX (Math formulas)
- Font Awesome icons

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eduplatform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/eduplatform
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the database**
   ```bash
   node backend/scripts/seedDatabase.js
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

7. **Access the application**
   Open http://localhost:5000 in your browser

## Production Deployment (Vercel)

### Prerequisites
- MongoDB Atlas account for cloud database
- Vercel account

### Steps

1. **Set up MongoDB Atlas**
   - Create a cluster on MongoDB Atlas
   - Get your connection string
   - Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Environment Variables on Vercel**
   Set these in your Vercel dashboard:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplatform
   JWT_SECRET=your_super_secure_jwt_secret_key_for_production
   NODE_ENV=production
   ```

4. **Update CORS Origins**
   The app automatically handles CORS for production domains ending in `.vercel.app`

## User Accounts

### Default Accounts (after seeding)
- **Owner**: owner@eduplatform.com / password123
- **Creator**: smith@eduplatform.com / password123  
- **Editor**: jane@eduplatform.com / password123

### Invite Codes
- **Creator**: CREATOR123456789
- **Editor**: EDITOR9876543210A

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:slug` - Get subject by slug

### Lessons
- `GET /api/lessons` - Get lessons with filters
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create lesson (auth required)
- `PUT /api/lessons/:id` - Update lesson (auth required)
- `POST /api/lessons/:id/rate` - Rate lesson (auth required)

### Search
- `GET /api/search?q=query` - Search across all content

### Users
- `GET /api/users/me` - Get user profile (auth required)
- `POST /api/users/me/bookmark/:lessonId` - Bookmark lesson (auth required)

## Project Structure

```
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   └── server.js
├── frontend/
│   ├── scripts/
│   ├── styles/
│   └── *.html
├── .env
├── package.json
└── vercel.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Author

Created by [Hojda Adelin](https://github.com/HojdaAdelin)