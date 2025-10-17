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
  // Tailwind-inspired inline styles for email compatibility
  const styles = {
    body: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: '1.6',
      color: '#1f2937',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9fafb',
    },
    container: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '40px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '32px',
      paddingBottom: '24px',
      borderBottom: '2px solid #6366f1',
    },
    logo: {
      fontSize: '28px',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, #6366f1, #9333ea)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline-block',
    },
    subtitle: {
      color: '#6b7280',
      marginTop: '12px',
      fontSize: '14px',
    },
    intro: {
      marginBottom: '24px',
      color: '#374151',
      fontSize: '15px',
    },
    sessionCard: {
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      backgroundColor: '#f9fafb',
    },
    sessionCardActive: {
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      backgroundColor: '#f0fdf4',
    },
    sessionName: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '12px',
    },
    badgeActive: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      marginLeft: '10px',
      backgroundColor: '#10b981',
      color: '#ffffff',
    },
    badgeEnded: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      marginLeft: '10px',
      backgroundColor: '#6b7280',
      color: '#ffffff',
    },
    sessionInfo: {
      color: '#6b7280',
      fontSize: '14px',
      marginBottom: '16px',
      lineHeight: '1.5',
    },
    buttonPrimary: {
      display: 'inline-block',
      padding: '12px 24px',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
      marginRight: '10px',
      marginBottom: '10px',
      background: 'linear-gradient(to right, #6366f1, #9333ea)',
      color: '#ffffff',
    },
    buttonSecondary: {
      display: 'inline-block',
      padding: '12px 24px',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
      marginBottom: '10px',
      backgroundColor: '#e5e7eb',
      color: '#374151',
    },
    footer: {
      marginTop: '32px',
      paddingTop: '24px',
      borderTop: '1px solid #e5e7eb',
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '12px',
    },
    footerLink: {
      color: '#6366f1',
      textDecoration: 'none',
      fontWeight: '500',
    },
  };

  return (
    <html>
      <body style={styles.body}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.logo}>⏰ Fast Track</div>
            <p style={styles.subtitle}>Your Fasting Sessions</p>
          </div>

          <p style={styles.intro}>
            Here are all your fasting sessions. Click the links below to access them:
          </p>

          {sessions.map((session) => (
            <div
              key={session.id}
              style={session.isActive ? styles.sessionCardActive : styles.sessionCard}
            >
              <div style={styles.sessionName}>
                {session.name}
                <span style={session.isActive ? styles.badgeActive : styles.badgeEnded}>
                  {session.isActive ? 'ACTIVE' : 'ENDED'}
                </span>
              </div>

              <div style={styles.sessionInfo}>
                Started: {new Date(session.startTime).toLocaleDateString()} at{' '}
                {new Date(session.startTime).toLocaleTimeString()}<br />
                Target Duration: {session.targetDuration} hours
              </div>

              <div>
                {session.editToken && (
                  <a
                    href={`${baseUrl}/session/${session.editToken}/${session.id}`}
                    style={styles.buttonPrimary}
                  >
                    Edit Session
                  </a>
                )}
                <a
                  href={`${baseUrl}/view/${session.id}`}
                  style={styles.buttonSecondary}
                >
                  View Only
                </a>
              </div>
            </div>
          ))}

          <div style={styles.footer}>
            <p>
              <a href={baseUrl} style={styles.footerLink}>
                Create a New Session
              </a>
            </p>
            <p style={{ marginTop: '12px' }}>
              Keep your edit links secure. Anyone with an edit link can modify your session.
            </p>
            <p style={{ marginTop: '12px' }}>
              Fast Track - Your comprehensive fasting companion
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
