# Feature 001: Email Session Links

## Overview
Enable users to associate their fasting sessions with an email address and retrieve all their session links via email. This solves the problem of accessing sessions from new devices where localStorage is not available.

## Problem Statement
Currently, users access their fasting sessions through:
1. **localStorage** - Session links stored in browser
2. **Manual entry** - Remembering session IDs (e.g., "fast-eagle-42") and edit tokens (4-digit codes)

When users switch devices or clear browser data, they lose easy access to their sessions and must remember complex identifiers.

## Solution
Allow users to:
1. **Associate email during session creation** - Optional email field when creating a new fasting session
2. **Retrieve links on-demand** - Click "Email Me My Sessions" button and enter email to receive all session links
3. **Access from any device** - Use emailed links to access sessions without localStorage

## User Stories

### Story 1: Creating a Session with Email
**As a** user creating a new fasting session
**I want to** optionally provide my email address
**So that** I can retrieve my session links later from any device

**Acceptance Criteria:**
- Email field is optional in session creation dialog
- Email validation occurs if provided
- Email is stored permanently with the session in Vercel KV
- Session creation succeeds whether or not email is provided

### Story 2: Retrieving Sessions via Email
**As a** user on a new device without localStorage
**I want to** receive links to all my sessions via email
**So that** I can access my fasting data without remembering codes

**Acceptance Criteria:**
- "Email Me My Sessions" button is visible on home page
- Clicking button opens dialog with email input
- Entering email and submitting retrieves all sessions for that email
- Email is sent containing all session links with metadata
- Both edit and read-only links are provided for each session
- Clear success/error messages are shown

## Technical Design

### Data Model Changes

#### FastingSession Interface
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
  email?: string; // NEW: Optional email address
}
```

### Storage Architecture

#### Session Storage
- **Key:** `session:{sessionId}`
- **Value:** Complete `FastingSession` object including email
- **Expiry:** 90 days (7776000 seconds)

#### Email Index
- **Key:** `email:{emailAddress}`
- **Value:** Array of session IDs `string[]`
- **Expiry:** 90 days (7776000 seconds)
- **Purpose:** Fast lookup of all sessions for a given email

**Example:**
```
Key: "email:user@example.com"
Value: ["fast-eagle-42", "quick-lion-123", "strong-bear-456"]
```

### API Endpoints

#### GET /api/sessions/by-email
Retrieve all sessions for a given email address.

**Query Parameters:**
- `email` (required): Email address to look up

**Response:**
```typescript
{
  sessions: FastingSession[]
}
```

**Error Responses:**
- 400: Missing or invalid email
- 404: No sessions found for email
- 500: Server error

#### POST /api/email/send-links
Send email with all session links for a given email address.

**Request Body:**
```typescript
{
  email: string
}
```

**Response:**
```typescript
{
  success: boolean,
  sessionCount: number,
  message: string
}
```

**Error Responses:**
- 400: Missing or invalid email
- 404: No sessions found for email
- 500: Email sending failed

### Email Template

The email will be styled with HTML and include:

**Header:**
- Fast Track logo/branding
- Title: "Your Fasting Sessions"

**For Each Session:**
- Session name
- Status badge (Active/Ended)
- Start time (formatted)
- Target duration
- Edit link (primary CTA button)
- Read-only link (secondary link)

**Footer:**
- App description
- Link to create new session
- Security note about edit tokens

### UI Components

#### NewSessionDialog Updates
Add email input field:
- Positioned after "Session Name" field
- Optional (not required)
- Email validation using standard regex
- Placeholder: "your@email.com (optional)"
- Help text: "Get links to your sessions via email"

#### EmailSessionLinksDialog (New)
Modal dialog for requesting session links:
- Email input field (required)
- Email validation
- Submit button: "Email Me My Sessions"
- Loading state while processing
- Success message: "Session links sent to {email}!"
- Error handling with clear messages

#### Home Page Updates
Add button next to "Start New Fasting Session":
- Text: "Email Me My Sessions"
- Secondary styling (less prominent than primary CTA)
- Opens EmailSessionLinksDialog when clicked

### Email Service Integration

#### Brevo (formerly Sendinblue)
- **Service:** Brevo (https://brevo.com)
- **Free Tier:** 300 emails/day forever
- **API Key:** Stored in `BREVO_API_KEY` environment variable
- **From Address:** Use Single Sender Verification (verify your personal email)
- **Setup:** Sign up → Settings → SMTP & API → API Keys → Create a new API key

#### Environment Variables
```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxx
BREVO_FROM_EMAIL=your-verified-email@gmail.com
BREVO_FROM_NAME=Fast Track
```

## Security Considerations

1. **No Authentication Required:** Sessions are already secured by edit tokens
2. **Email Validation:** Standard regex validation on frontend and backend
3. **Rate Limiting:** Consider implementing rate limiting on email endpoint (future enhancement)
4. **No PII Beyond Email:** Only email address is stored, no other personal data
5. **Edit Token Security:** 4-digit tokens provide basic security; edit links should not be shared publicly

## User Flow Diagrams

### Creating Session with Email
```
User clicks "Start New Session"
  → Dialog opens
  → User enters: name, start time, duration, email (optional)
  → User clicks "Create Session"
  → Session saved to Vercel KV with email
  → Email added to email index (if provided)
  → User navigated to session page
```

### Retrieving Sessions via Email
```
User on new device visits home page
  → Clicks "Email Me My Sessions"
  → Dialog opens requesting email
  → User enters email
  → User clicks "Email Me My Sessions"
  → System queries email index
  → System loads all sessions for that email
  → System sends email via Resend
  → User sees success message
  → User checks email inbox
  → User clicks link in email
  → User accesses session
```

## Future Enhancements

1. **Email Verification:** Verify email addresses before sending (prevent spam)
2. **Rate Limiting:** Limit email requests per IP address
3. **Unsubscribe:** Allow users to remove email from all sessions
4. **Session Digest:** Weekly summary emails of active sessions
5. **Email Preferences:** Let users opt in/out of various email types
6. **Magic Link Auth:** Use email as authentication method instead of edit tokens

## Success Metrics

- Percentage of sessions created with email addresses
- Number of "Email Me My Sessions" requests per week
- User retention improvement (can access sessions from multiple devices)
- Reduction in support requests about lost sessions

## Testing Checklist

- [ ] Session creation with email saves to KV correctly
- [ ] Session creation without email still works
- [ ] Email validation prevents invalid formats
- [ ] Email index is maintained correctly
- [ ] Sessions can be retrieved by email via API
- [ ] Email is sent successfully via Resend
- [ ] Email contains correct links for all sessions
- [ ] Edit links work correctly from email
- [ ] Read-only links work correctly from email
- [ ] Error handling works for missing/invalid emails
- [ ] UI shows appropriate loading and success states
- [ ] Works on mobile and desktop

## Dependencies

- `resend` npm package (^4.0.0)
- Vercel KV for storage (already in use)
- Valid Resend API key in environment variables

## Timeline Estimate

- Feature documentation: 0.5 hours ✓
- Data model and types: 0.5 hours
- UI components: 2 hours
- API endpoints: 2 hours
- Email template: 1 hour
- Testing and refinement: 2 hours
- **Total:** ~8 hours
