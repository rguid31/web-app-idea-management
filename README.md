# 💡 Idea Board - Collaborative Idea Management App

A modern, full-stack web application for managing and voting on ideas with GitHub integration for inspiration. Built with React, Firebase, and Tailwind CSS.

## 🌟 Features

### Core Functionality
- **User Authentication** - Secure login/logout with Firebase Auth
- **Idea Management** - Create, view, and delete ideas
- **Voting System** - Vote on ideas with real-time vote counts
- **Real-time Updates** - Live synchronization using Firestore
- **Responsive Design** - Beautiful UI that works on all devices

### GitHub Integration
- **Trending Repositories** - Browse trending GitHub repos for inspiration
- **Repository Details** - View stars, forks, language, and descriptions
- **Idea Inspiration** - Link ideas to GitHub repositories
- **Auto-fill** - Automatically populate idea text from repo descriptions

### Technical Features
- **Modern Stack** - React 18 + Vite for fast development
- **Firebase Backend** - Firestore database with real-time capabilities
- **Tailwind CSS** - Utility-first CSS framework for styling
- **ESLint** - Code quality and consistency
- **Firebase Hosting** - Production deployment

## 🚀 Live Demo

Visit the live application: [https://idea-board-app.web.app](https://idea-board-app.web.app)

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **APIs**: GitHub API for trending repositories
- **Development**: ESLint, PostCSS

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd idea-board
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Get your Firebase configuration

#### Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Update Firebase Configuration
Update `src/firebase.js` with your Firebase config:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 4. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🚀 Deployment

### Deploy to Firebase Hosting
```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

### Deployment Scripts
The project includes convenient deployment scripts:
- `start-session.sh` - Start development session
- `finish-session.sh` - Build and deploy

## 📁 Project Structure

```
idea-board/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── IdeaBoard.jsx   # Main idea management component
│   │   ├── Login.jsx       # Authentication component
│   │   └── TrendingRepos.jsx # GitHub integration component
│   ├── services/           # API services
│   │   └── githubApi.js    # GitHub API integration
│   ├── App.jsx             # Main app component
│   ├── firebase.js         # Firebase configuration
│   └── main.jsx            # App entry point
├── firebase.json           # Firebase configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.mjs      # PostCSS configuration
└── vite.config.js          # Vite configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Key Features Explained

### Authentication System
- Firebase Authentication with email/password
- Secure user sessions
- Protected routes and components

### Real-time Idea Management
- Create, read, and delete ideas
- Real-time updates across all users
- User-specific idea ownership

### Voting System
- One vote per user per idea
- Real-time vote count updates
- Visual feedback for voted ideas

### GitHub Integration
- Browse trending repositories by language
- Get repository details (stars, forks, description)
- Link ideas to GitHub repositories for inspiration
- Auto-fill idea text from repository descriptions

## 🔒 Security

- Firebase Security Rules for Firestore
- Environment variables for sensitive data
- User authentication required for all operations
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Configuration Errors**
   - Ensure all environment variables are set correctly
   - Check for trailing characters in `.env.local`
   - Verify Firebase project settings

2. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check for PostCSS configuration issues
   - Ensure Tailwind CSS is properly configured

3. **Deployment Issues**
   - Run commands from the `idea-board` directory
   - Ensure Firebase CLI is installed globally
   - Check Firebase project permissions

### Firestore Indexes
If you encounter indexing errors when sorting by votes, create the required composite index:
```bash
firebase deploy --only firestore:indexes
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Firebase for the backend infrastructure
- GitHub for the API integration
- Tailwind CSS for the beautiful UI components
- React and Vite for the modern development experience

---

**Happy ideating! 💡**
