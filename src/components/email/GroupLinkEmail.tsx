import * as React from 'react';

interface GroupLinkEmailProps {
  kind: 'report' | 'invite' | 'organizer';
  groupName: string;
  participantName?: string; // for kind 'report'
  groupId: string;
  token?: string; // reportToken for 'report', editToken for 'organizer'
  startTime: Date | string;
  targetDuration: number;
  baseUrl: string;
}

// Warm-palette email matching the app redesign (email-safe fonts/inline styles)
export const GroupLinkEmail: React.FC<GroupLinkEmailProps> = ({
  kind,
  groupName,
  participantName,
  groupId,
  token,
  startTime,
  targetDuration,
  baseUrl,
}) => {
  const styles = {
    body: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      lineHeight: '1.6',
      color: '#2c2620',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f4ede0',
    },
    container: {
      backgroundColor: '#fbf7ee',
      border: '1px solid #e0d5c2',
      borderRadius: '16px',
      padding: '36px',
    },
    logo: {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      fontWeight: 700 as const,
      textAlign: 'center' as const,
      marginBottom: '24px',
    },
    heading: {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      fontWeight: 500 as const,
      marginBottom: '6px',
    },
    sub: {
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic' as const,
      color: '#8a8172',
      fontSize: '15px',
      marginBottom: '24px',
    },
    info: {
      color: '#8a8172',
      fontSize: '14px',
      marginBottom: '24px',
    },
    button: {
      display: 'inline-block',
      padding: '14px 28px',
      borderRadius: '12px',
      textDecoration: 'none',
      fontWeight: 600 as const,
      backgroundColor: '#b5643f',
      color: '#ffffff',
      marginBottom: '16px',
    },
    linkBlock: {
      fontSize: '13px',
      color: '#8a8172',
      wordBreak: 'break-all' as const,
      marginBottom: '8px',
    },
    rawLink: { color: '#b5643f', textDecoration: 'underline' },
    footer: {
      marginTop: '28px',
      paddingTop: '20px',
      borderTop: '1px solid #e0d5c2',
      textAlign: 'center' as const,
      color: '#8a8172',
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic' as const,
    },
  };

  const start = new Date(startTime);
  const viewUrl = `${baseUrl}/group/view/${groupId}`;
  const primary =
    kind === 'invite'
      ? { url: `${baseUrl}/group/join/${groupId}`, label: 'Join the fast' }
      : kind === 'report'
        ? { url: `${baseUrl}/group/report/${token}/${groupId}`, label: 'Open your report page' }
        : { url: `${baseUrl}/group/${token}/${groupId}`, label: 'Open your organizer page' };

  const heading =
    kind === 'invite'
      ? `You're invited to ${groupName}`
      : kind === 'report'
        ? `You're in, ${participantName ?? 'friend'}`
        : `${groupName} is yours to steer`;

  const sub =
    kind === 'invite'
      ? 'one shared fast — join by link, report your own check-ins'
      : kind === 'report'
        ? `your personal link for ${groupName} — keep it, it's how your check-ins land under your name`
        : 'your organizer link — you hold the clock';

  return (
    <html>
      <body style={styles.body}>
        <div style={styles.container}>
          <div style={styles.logo}>
            Fast<span style={{ color: '#b5643f' }}>·</span>Track
          </div>
          <div style={styles.heading}>{heading}</div>
          <div style={styles.sub}>{sub}</div>
          <div style={styles.info}>
            Shared start: {start.toISOString().slice(0, 10)} {String(start.getUTCHours()).padStart(2, '0')}:{String(start.getUTCMinutes()).padStart(2, '0')} UTC
            <br />
            Target: {targetDuration} hours — one clock for everyone
          </div>
          <a href={primary.url} style={styles.button}>
            {primary.label}
          </a>
          <div style={styles.linkBlock}>
            {primary.label}:{' '}
            <a href={primary.url} style={styles.rawLink}>
              {primary.url}
            </a>
          </div>
          <div style={styles.linkBlock}>
            Watch the group (read-only):{' '}
            <a href={viewUrl} style={styles.rawLink}>
              {viewUrl}
            </a>
          </div>
          <div style={styles.footer}>
            {kind === 'invite'
              ? 'no account needed — your link is your key'
              : 'keep this link private — anyone with it can report as you'}
          </div>
        </div>
      </body>
    </html>
  );
};
