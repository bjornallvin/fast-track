# Implementation Guide: Feature 001 - Email Session Links

## Implementation Order

This document provides step-by-step implementation instructions for the Email Session Links feature.

## Phase 1: Data Model & Types

### Step 1: Update FastingSession Type
**File:** `src/types/index.ts`

Add email field to the FastingSession interface:

```typescript
export interface FastingSession {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date | null;
  targetDuration: number;
  isActive: boolean;
  entries: CheckinEntry[];
  bodyMetrics: BodyMetric[];
  notes: JournalEntry[];
  editToken?: string;
  email?: string; // Add this line
}
```

## Phase 2: Session Creation Flow

### Step 2: Update NewSessionDialog Component
**File:** `src/components/NewSessionDialog.tsx`

1. Add email state:
```typescript
const [email, setEmail] = useState('');
```

2. Add email validation function:
```typescript
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

3. Update handleSubmit to validate and pass email:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!name.trim()) {
    alert('Please enter a name for the session');
    return;
  }

  // Validate email if provided
  if (email.trim() && !isValidEmail(email.trim())) {
    alert('Please enter a valid email address');
    return;
  }

  let sessionStartTime: Date;
  if (startNow) {
    sessionStartTime = new Date();
  } else {
    sessionStartTime = new Date(`${startDate}T${startTime}`);
  }

  onCreateSession(
    name.trim(),
    sessionStartTime,
    parseInt(targetDuration),
    email.trim() || undefined // Pass email or undefined
  );
};
```

4. Add email input field in the form (after Session Name):
```typescript
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Email (optional)
  </label>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="your@email.com"
    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  />
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    Get links to your sessions via email
  </p>
</div>
```

5. Update props interface:
```typescript
interface NewSessionDialogProps {
  onCreateSession: (
    name: string,
    startTime: Date,
    targetDuration: number,
    email?: string
  ) => void;
  onClose: () => void;
}
```

### Step 3: Update Home Page
**File:** `src/app/page.tsx`

Update handleCreateSession to accept and use email:

```typescript
const handleCreateSession = async (
  name: string,
  startTime: Date,
  targetDuration: number,
  email?: string
) => {
  const sessionId = generateSessionId();
  const editToken = generateEditToken();
  const newSession: FastingSession = {
    id: sessionId,
    name,
    startTime,
    endTime: null,
    targetDuration,
    isActive: true,
    entries: [],
    bodyMetrics: [],
    notes: [],
    editToken,
    email // Add email field
  };

  // Save to KV
  try {
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSession)
    });

    // ... rest of the function remains the same
  } catch (error) {
    console.error('Error saving session:', error);
    alert('Failed to create session. Please try again.');
    return;
  }

  router.push(`/session/${editToken}/${sessionId}`);
};
```

## Phase 3: API Endpoints for Email Index

### Step 4: Update Session API to Maintain Email Index
**File:** `src/app/api/sessions/[id]/route.ts`

Update the POST handler to maintain email index:

```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session: FastingSession = await request.json();
    const id = params.id;

    // Save session
    await kv.set(`session:${id}`, session, { ex: 7776000 });

    // If email provided, maintain email index
    if (session.email) {
      const emailKey = `email:${session.email.toLowerCase()}`;

      // Get existing session IDs for this email
      const existingIds = await kv.get<string[]>(emailKey) || [];

      // Add this session ID if not already present
      if (!existingIds.includes(id)) {
        existingIds.push(id);
        await kv.set(emailKey, existingIds, { ex: 7776000 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    );
  }
}
```

### Step 5: Create Sessions by Email API
**File:** `src/app/api/sessions/by-email/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { FastingSession } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get session IDs for this email
    const emailKey = `email:${email.toLowerCase()}`;
    const sessionIds = await kv.get<string[]>(emailKey);

    if (!sessionIds || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found for this email' },
        { status: 404 }
      );
    }

    // Fetch all sessions
    const sessions: FastingSession[] = [];
    for (const id of sessionIds) {
      const session = await kv.get<FastingSession>(`session:${id}`);
      if (session) {
        sessions.push(session);
      }
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions by email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
```

## Phase 4: Email Integration

### Step 6: Install Brevo and React Email Packages

```bash
npm install @getbrevo/brevo @react-email/render @react-email/components
```

### Step 7: Create Email Template Component
**File:** `src/components/email/SessionLinksEmail.tsx`

```typescript
import * as React from 'react';

interface SessionData {
  id: string;
  name: string;
  editToken?: string;
  isActive: boolean;
  startTime: Date;
  targetDuration: number;
}

interface SessionLinksEmailProps {
  sessions: SessionData[];
  baseUrl: string;
}

export const SessionLinksEmail: React.FC<SessionLinksEmailProps> = ({
  sessions,
  baseUrl
}) => {
  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #6366f1;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(to right, #6366f1, #9333ea);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .session-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #f9fafb;
          }
          .session-card.active {
            border-color: #10b981;
            background-color: #f0fdf4;
          }
          .session-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .session-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
          }
          .badge-active {
            background-color: #10b981;
            color: white;
          }
          .badge-ended {
            background-color: #6b7280;
            color: white;
          }
          .session-info {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 15px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-right: 10px;
            margin-bottom: 10px;
          }
          .button-primary {
            background: linear-gradient(to right, #6366f1, #9333ea);
            color: white;
          }
          .button-secondary {
            background-color: #e5e7eb;
            color: #374151;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">⏰ Fast Track</div>
            <p style={{ color: '#6b7280', marginTop: '10px' }}>Your Fasting Sessions</p>
          </div>

          <p style={{ marginBottom: '20px' }}>
            Here are all your fasting sessions. Click the links below to access them:
          </p>

          {sessions.map((session) => (
            <div key={session.id} className={`session-card ${session.isActive ? 'active' : ''}`}>
              <div className="session-name">
                {session.name}
                <span className={`session-badge ${session.isActive ? 'badge-active' : 'badge-ended'}`}>
                  {session.isActive ? 'ACTIVE' : 'ENDED'}
                </span>
              </div>

              <div className="session-info">
                Started: {new Date(session.startTime).toLocaleDateString()} at{' '}
                {new Date(session.startTime).toLocaleTimeString()}<br />
                Target Duration: {session.targetDuration} hours
              </div>

              <div>
                {session.editToken && (
                  <a
                    href={`${baseUrl}/session/${session.editToken}/${session.id}`}
                    className="button button-primary"
                  >
                    Edit Session
                  </a>
                )}
                <a
                  href={`${baseUrl}/view/${session.id}`}
                  className="button button-secondary"
                >
                  View Only
                </a>
              </div>
            </div>
          ))}

          <div className="footer">
            <p>
              <a href={baseUrl} style={{ color: '#6366f1', textDecoration: 'none' }}>
                Create a New Session
              </a>
            </p>
            <p style={{ marginTop: '10px' }}>
              Keep your edit links secure. Anyone with an edit link can modify your session.
            </p>
            <p style={{ marginTop: '10px' }}>
              Fast Track - Your comprehensive fasting companion
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
```

### Step 8: Create Send Email API Endpoint
**File:** `src/app/api/email/send-links/route.ts`

```typescript
import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';
import { kv } from '@vercel/kv';
import type { FastingSession } from '@/types';
import { SessionLinksEmail } from '@/components/email/SessionLinksEmail';
import { render } from '@react-email/render';

// Initialize Brevo
const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get session IDs for this email
    const emailKey = `email:${email.toLowerCase()}`;
    const sessionIds = await kv.get<string[]>(emailKey);

    if (!sessionIds || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found for this email' },
        { status: 404 }
      );
    }

    // Fetch all sessions
    const sessions: FastingSession[] = [];
    for (const id of sessionIds) {
      const session = await kv.get<FastingSession>(`session:${id}`);
      if (session) {
        sessions.push(session);
      }
    }

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found' },
        { status: 404 }
      );
    }

    // Prepare session data for email
    const sessionData = sessions.map(s => ({
      id: s.id,
      name: s.name,
      editToken: s.editToken,
      isActive: s.isActive,
      startTime: s.startTime,
      targetDuration: s.targetDuration
    }));

    // Get base URL (production or development)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fast-tracking.vercel.app';

    // Render email HTML using React Email
    const emailHtml = await render(
      SessionLinksEmail({ sessions: sessionData, baseUrl })
    );

    // Get sender info from environment variables
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@example.com';
    const fromName = process.env.BREVO_FROM_NAME || 'Fast Track';

    // Prepare email payload for Brevo
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: fromEmail, name: fromName };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = 'Your Fast Track Session Links';
    sendSmtpEmail.htmlContent = emailHtml;

    // Send email via Brevo
    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: any) {
      console.error('Brevo error:', error);
      if (error.response) {
        console.error('Brevo error body:', error.response.body);
      }
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionCount: sessions.length,
      message: `Sent ${sessions.length} session link(s) to ${email}`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
```

## Phase 5: UI Components

### Step 9: Create EmailSessionLinksDialog Component
**File:** `src/components/EmailSessionLinksDialog.tsx`

```typescript
import { useState } from 'react';

interface EmailSessionLinksDialogProps {
  onClose: () => void;
}

const EmailSessionLinksDialog: React.FC<EmailSessionLinksDialogProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/email/send-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError('No sessions found for this email address');
        } else {
          setError(data.error || 'Failed to send email');
        }
        return;
      }

      setSuccess(true);
      setEmail('');

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error sending email:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Email Me My Sessions
        </h2>

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <p className="text-green-800 dark:text-green-200 text-center">
              ✓ Session links sent to {email}!<br />
              Check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the email you used when creating your sessions
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Email Me My Sessions'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailSessionLinksDialog;
```

### Step 10: Update Home Page to Include Email Button
**File:** `src/app/page.tsx`

1. Add state for email dialog:
```typescript
const [showEmailDialog, setShowEmailDialog] = useState(false);
```

2. Import the component:
```typescript
import EmailSessionLinksDialog from '@/components/EmailSessionLinksDialog';
```

3. Add button next to "Start New Fasting Session" (inside the Quick Start Card):
```typescript
<div className="flex flex-col sm:flex-row gap-3 justify-center">
  <button
    onClick={() => setShowNewSession(true)}
    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition duration-200 text-lg font-medium shadow-lg transform hover:scale-105 cursor-pointer"
  >
    Start New Fasting Session
  </button>
  <button
    onClick={() => setShowEmailDialog(true)}
    className="bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-400 px-10 py-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-gray-600 transition duration-200 text-lg font-medium shadow-lg transform hover:scale-105 cursor-pointer"
  >
    Email Me My Sessions
  </button>
</div>
```

4. Add dialog at the bottom (near the existing NewSessionDialog):
```typescript
{showEmailDialog && (
  <EmailSessionLinksDialog onClose={() => setShowEmailDialog(false)} />
)}
```

## Phase 6: Environment Setup

### Step 11: Add Environment Variables

1. Sign up for Brevo at https://brevo.com (free account)
2. Verify a sender email:
   - Go to Settings → Senders & IP
   - Add and verify your personal email (e.g., your Gmail)
   - Check your inbox for verification email
3. Get your API key:
   - Go to Settings → SMTP & API → API Keys
   - Click "Generate a new API key"
   - Name it "Fast Track" and copy the key
4. Add to `.env.local`:
```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxx
BREVO_FROM_EMAIL=your-verified-email@gmail.com
BREVO_FROM_NAME=Fast Track
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

5. Add to Vercel project settings:
   - Go to project settings → Environment Variables
   - Add `BREVO_API_KEY` with your key
   - Add `BREVO_FROM_EMAIL` with your verified email
   - Add `BREVO_FROM_NAME` with "Fast Track"
   - Add `NEXT_PUBLIC_BASE_URL` with `https://fast-tracking.vercel.app`

## Phase 7: Testing

### Step 12: Test Checklist

1. **Session Creation with Email:**
   - [ ] Create session with valid email → saves correctly
   - [ ] Create session without email → works as before
   - [ ] Create session with invalid email → shows error
   - [ ] Check Vercel KV that email is stored with session
   - [ ] Check email index is created/updated

2. **Email Retrieval:**
   - [ ] Click "Email Me My Sessions" → dialog opens
   - [ ] Submit empty email → shows error
   - [ ] Submit invalid email → shows error
   - [ ] Submit email with no sessions → shows error
   - [ ] Submit email with sessions → success, email sent
   - [ ] Check inbox for email
   - [ ] Verify email contains all sessions
   - [ ] Click edit link → works correctly
   - [ ] Click view link → works correctly

3. **API Endpoints:**
   - [ ] Test `/api/sessions/by-email?email=test@example.com`
   - [ ] Test `/api/email/send-links` with POST request
   - [ ] Verify error handling for missing/invalid data

4. **UI/UX:**
   - [ ] Mobile responsive design
   - [ ] Dark mode works correctly
   - [ ] Loading states display properly
   - [ ] Success/error messages are clear
   - [ ] Dialogs close properly

## Deployment

1. Install dependencies: `npm install`
2. Run build: `npm run build`
3. Deploy to Vercel: `vercel --prod`
4. Verify environment variables are set in Vercel
5. Test in production environment

## Rollback Plan

If issues arise:
1. All changes are backward compatible (email field is optional)
2. Can deploy without email features by reverting home page changes
3. Session creation still works without email functionality
4. No breaking changes to existing sessions or data structures
