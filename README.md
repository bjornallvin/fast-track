# Fast Track - Comprehensive Fasting Tracker

A modern, privacy-focused fasting tracker with real-time monitoring, body metrics, and secure sharing capabilities.

🌐 **Live Demo**: [https://fast-track.vercel.app](https://fast-track.vercel.app)

## Features

### 🎯 Core Functionality
- **Real-time fasting timer** with progress visualization
- **5 key wellness metrics** tracking (energy, hunger, mental clarity, mood, physical comfort)
- **Body composition tracking** (weight, body fat percentage)
- **Journal entries** with tagging system
- **Visual progress charts** with interactive data visualization
- **Dark mode** with system preference detection

### 🔒 Privacy & Security
- **No public session listing** - sessions only accessible via direct links
- **Dual access modes**:
  - Edit mode with secure token (`/session/[token]/[id]`)
  - Read-only sharing (`/view/[id]`)
- **Local session management** - your sessions stored in browser
- **Cloud sync** via Vercel KV for cross-device access

### 📊 Data Management
- **Export data** as JSON or CSV for backup and analysis
- **Swedish date/time formatting** (YYYY-MM-DD HH:mm)
- **Automatic session persistence** across devices
- **Offline-capable** with cloud sync when online

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel KV (Redis)
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Vercel KV database (for cloud storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bjornallvin/fast-track.git
cd fast-track
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with your Vercel KV credentials:
```env
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Usage

### Starting a Fast
1. Click "Start New Fasting Session" on the home page
2. Enter session name and target duration (16-120 hours)
3. Track your progress with regular check-ins

### Tracking Your Progress
- **Quick Check-in**: Record your current state (1-10 scale for each metric)
- **Body Metrics**: Log weight and body fat percentage changes
- **Journal**: Document experiences, insights, and observations with tags
- **Charts**: View trends over time with interactive visualizations

### Sharing Sessions
- **Edit link**: Keep your edit URL private (`/session/[token]/[id]`)
- **Share link**: Share the read-only URL (`/view/[id]`) with others
- Visited sessions are automatically saved in your browser for easy access

### Data Privacy
- Sessions are private by default
- No public discovery or browsing of sessions
- Only accessible via direct links
- Edit tokens prevent unauthorized modifications

## Scientific Basis

The app includes evidence-based information about fasting, with references to peer-reviewed research from:
- New England Journal of Medicine
- Cell Metabolism
- Nature
- Annual Review of Nutrition

⚠️ **Medical Disclaimer**: Consult a healthcare provider before starting any fasting regimen, especially if you have diabetes, take medications, are pregnant/nursing, or have a history of eating disorders.

## Development

### Build for production:
```bash
npm run build
```

### Run tests:
```bash
npm test
```

### Lint code:
```bash
npm run lint
```

### Type checking:
```bash
npm run type-check
```

## Deployment

The app is configured for deployment on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Configure KV storage in Vercel dashboard
4. Deploy

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── styles/          # Global styles
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Author

Created by **Björn Allvin**
- GitHub: [@bjornallvin](https://github.com/bjornallvin)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Deployed on [Vercel](https://vercel.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Charts by [Recharts](https://recharts.org/)

---

Made with ❤️ to support the fasting community in tracking their wellness journey.