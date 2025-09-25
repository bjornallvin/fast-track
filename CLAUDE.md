# Claude Code Project Notes

## Fast Track - Fasting Tracker Application

### Deployment Process
- **Method**: Manual deployment using Vercel CLI
- **Command**: `vercel` or `vercel --prod` for production deployment
- **Note**: Deployment is NOT automatic on git push - must be done manually via CLI

### Project Structure
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Database**: Vercel KV (Redis)
- **Live URL**: https://fast-tracking.vercel.app

### Recent Changes
- Added custom favicon matching homepage clock icon (commit 84e743a)
- Favicon includes gradient design matching brand colors (#6366f1 to #9333ea)
- Updated layout.tsx metadata for proper favicon serving

### Key Features
- Real-time fasting timer with progress tracking
- 5 wellness metrics (energy, hunger, mental clarity, mood, physical comfort)
- Body composition tracking
- Journal with tagging system
- Session sharing (edit vs read-only modes)
- Dark mode support
- Data export (JSON/CSV)

### Development
- Dev server: `npm run dev`
- Build: `npm run build`
- Local URL: http://localhost:3000

### Environment Variables
- Requires Vercel KV credentials in .env.local for cloud storage
- Currently has Garmin credentials in .env (for potential future integration)