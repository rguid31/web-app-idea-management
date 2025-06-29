# CLAUDE.md - Idea Board Project Guide

## Project Overview
**Idea Board** is a collaborative idea management application built with React, Firebase, and Tailwind CSS. It allows users to create, vote on, and manage ideas with real-time synchronization and GitHub integration for inspiration.

## Tech Stack
- **Frontend**: React 18 + Vite, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **APIs**: GitHub API for trending repositories
- **Build Tools**: Vite, ESLint, PostCSS

## Project Structure
```
src/
├── components/
│   ├── IdeaBoard.jsx      # Main idea management interface
│   ├── Login.jsx          # Authentication (email/password + anonymous)
│   ├── TrendingRepos.jsx  # GitHub integration component
│   └── AccountSettings.jsx # User profile management
├── services/
│   └── githubApi.js       # GitHub API integration service
├── App.jsx                # Main app component with auth state
├── firebase.js            # Firebase configuration
└── main.jsx               # Entry point
```

## Key Features
1. **Authentication**: Firebase Auth with email/password and anonymous login
2. **Idea Management**: Create, view, vote on ideas with real-time updates
3. **Voting System**: One vote per user per idea with real-time counts
4. **GitHub Integration**: Browse trending repos, auto-fill ideas from repo descriptions
5. **Sorting**: Sort ideas by chronological (Latest), Hot, New, Top
6. **User Profiles**: Username management for registered users

## Development Commands
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Firebase Configuration
Environment variables needed in `.env.local`:
```
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
```

## Database Schema

### Firestore Collections:
1. **ideas** - Core idea documents
   - `id` (auto-generated)
   - `text` (string)
   - `userId` (string)
   - `userEmail` (string)
   - `userDisplayName` (string, optional)
   - `votes` (number, default: 0)
   - `votedBy` (array of user IDs)
   - `createdAt` (timestamp)
   - `githubRepo` (object, optional)

2. **users** - User profile documents
   - `uid` (document ID)
   - `email` (string)
   - `username` (string)
   - `createdAt` (timestamp)

3. **usernames** - Username uniqueness tracking
   - `username` (document ID)
   - `uid` (string)

## Security Rules
- Ideas: Public read, authenticated create/update/delete with owner restrictions
- Voting: Allow authenticated users to vote on any idea
- Users: Users can only manage their own profiles
- Usernames: Read-only after creation for uniqueness

## Important File Locations
- Firebase config: `src/firebase.js:6-13`
- Main app logic: `src/App.jsx:9-51`
- Idea management: `src/components/IdeaBoard.jsx`
- Authentication: `src/components/Login.jsx`
- GitHub API: `src/services/githubApi.js`
- Security rules: `firestore.rules`

## Common Development Tasks

### Adding New Features
1. Follow existing component patterns in `src/components/`
2. Use Firebase hooks and real-time listeners
3. Maintain responsive design with Tailwind classes
4. Update Firestore rules if new data access patterns needed

### Database Operations
- Use Firestore real-time listeners (`onSnapshot`) for live updates
- Follow existing voting logic in `IdeaBoard.jsx:140-180`
- Maintain user profile sync patterns

### Styling
- Uses Tailwind CSS with dark theme (slate colors)
- Responsive design with `sm:` prefixes
- Mobile-first approach

### Testing & Deployment
- Run `npm run lint` before committing
- Build with `npm run build`
- Deploy with `firebase deploy`
- Use deployment scripts: `start-session.sh`, `finish-session.sh`

## Environment Notes
- Anonymous authentication enabled for quick user onboarding
- GitHub API used without authentication (public repos only)
- Real-time updates across all connected clients
- Mobile-responsive design for iOS/Android browsers

## Troubleshooting
- Clear node_modules and reinstall if build errors occur
- Check Firebase console for quota limits
- Verify environment variables are correctly set
- Use browser dev tools to debug Firestore connection issues