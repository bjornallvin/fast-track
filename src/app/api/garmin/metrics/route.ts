import { NextResponse } from 'next/server';
import { GarminConnect } from 'garmin-connect';

// Store credentials in environment variables for security
const GARMIN_USERNAME = process.env.GARMIN_USERNAME || '';
const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD || '';

export async function GET() {
  if (!GARMIN_USERNAME || !GARMIN_PASSWORD ||
      GARMIN_USERNAME === 'your_garmin_email@example.com') {
    return NextResponse.json(
      { error: 'Garmin credentials not configured. Please add your Garmin username and password to .env.local' },
      { status: 400 }
    );
  }

  try {
    // Create a new Garmin Connect client
    const GCClient = new GarminConnect({
      username: GARMIN_USERNAME,
      password: GARMIN_PASSWORD,
    });

    // Login to Garmin
    await GCClient.login();

    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Get user info for body metrics
    const userInfo = await GCClient.getUserInfo();

    // Get weight data
    const weightData = await GCClient.getWeightData(dateString);

    // Get body composition data if available
    const bodyComposition = await GCClient.getBodyComposition(dateString);

    // Get hydration data
    const hydration = await GCClient.getHydrationData(dateString);

    // Format the response
    const metrics = {
      weight: weightData?.weight || null,
      bodyFatPercentage: bodyComposition?.bodyFatPercentage || null,
      muscleMass: bodyComposition?.muscleMass || null,
      boneMass: bodyComposition?.boneMass || null,
      hydration: hydration?.valueInML || null,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Garmin API error:', error);

    // Check for specific error types
    if (error.message?.includes('MFA') || error.message?.includes('Ticket not found')) {
      return NextResponse.json(
        {
          error: 'Garmin requires Multi-Factor Authentication (MFA) or has additional security. The unofficial API may not support this. Consider exporting your data manually from Garmin Connect instead.',
          details: 'Garmin has enhanced security that prevents automated access. You can export your data as CSV from connect.garmin.com'
        },
        { status: 403 }
      );
    }

    if (error.message?.includes('login failed')) {
      return NextResponse.json(
        {
          error: 'Login failed. Please check your Garmin username and password in .env.local',
          details: error.message
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch Garmin data',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password required' },
      { status: 400 }
    );
  }

  try {
    // Test the credentials
    const GCClient = new GarminConnect({
      username,
      password,
    });

    await GCClient.login();

    // If login successful, you could save encrypted credentials
    // For now, just return success
    return NextResponse.json({ success: true, message: 'Credentials valid' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}