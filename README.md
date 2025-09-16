# Fast Track - Fasting Tracker

A comprehensive web application for tracking extended fasting sessions with support for multiple users.

## Features

### 🎯 Core Functionality
- **Multi-Session Support**: Track multiple fasting sessions for different people
- **Smart Timer**: Dynamic milestone display with circular progress indicators
- **Flexible Durations**: Support for fasts from 16 hours to 5+ days
- **Real-time Progress**: Visual progress tracking with percentage completion

### 📊 Tracking & Metrics
- **Check-in System**: Record energy, hunger, mental clarity, mood, and physical comfort (1-10 scale)
- **Body Metrics**: Track weight and body fat percentage
- **Journal Entries**: Document experiences with tagging system
- **Progress Charts**: Visualize trends over time with interactive charts

### 💾 Data Management
- **Export/Import**: Save sessions as JSON or CSV for backup and analysis
- **Local Storage**: All data persisted in browser storage
- **Session Switching**: Easy switching between different fasting sessions

### 🎨 User Experience
- **Swedish Time Format**: All dates/times in ISO format (YYYY-MM-DD HH:mm)
- **Responsive Design**: Works on desktop and mobile devices
- **Visual Feedback**: Descriptive text for metric scales to guide input
- **Clean Interface**: Intuitive navigation with session dropdown

## Tech Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Hooks
- **Storage**: Browser LocalStorage

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/bjornallvin/fast-track.git
cd fast-track

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm run start
```

## Usage

1. **Create a Session**: Click the dropdown in the top-right and "Create New Session"
2. **Name Your Fast**: Enter a name (e.g., "John's 72h Fast")
3. **Set Duration**: Choose your target duration (16h to 120h)
4. **Track Progress**: The timer shows elapsed time and daily milestones
5. **Regular Check-ins**: Click "Quick Check-in" to record how you're feeling
6. **Add Metrics**: Record weight and body fat measurements
7. **Journal**: Document your experiences and insights
8. **Export Data**: Save your session data for analysis or backup

## Features in Detail

### Check-in Metrics
Each check-in tracks:
- **Energy Level**: From exhausted (1) to peak energy (10)
- **Hunger Level**: From no hunger (1) to extreme hunger (10)
- **Mental Clarity**: From brain fog (1) to peak mental performance (10)
- **Mood**: From severely low (1) to euphoric (10)
- **Physical Comfort**: From severe discomfort (1) to perfect comfort (10)
- **Sleep Quality** (optional)
- **Water Intake** (optional)
- **Electrolytes** (optional)

### Session Management
- Switch between multiple fasting sessions
- Each session maintains independent data
- Delete old sessions (except when only one remains)
- Import previously exported sessions

### Data Export
- **JSON Format**: Complete session data for re-import
- **CSV Format**: Structured data for spreadsheet analysis

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

Built with ❤️ to support the fasting community in tracking their wellness journey.