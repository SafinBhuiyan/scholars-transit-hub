import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { NextResponse } from 'next/server';

const propertyId = process.env.GA_PROPERTY_ID;

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days') || '90';

  if (!propertyId || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Missing Google Analytics credentials in environment variables.' }, { status: 500 });
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'date' },
        { name: 'deviceCategory' }
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
    });

    const formattedData = new Map();

    response.rows?.forEach(row => {
      const dateStr = row.dimensionValues?.[0]?.value;
      const device = row.dimensionValues?.[1]?.value?.toLowerCase();
      const users = parseInt(row.metricValues?.[0]?.value || '0', 10);

      const date = `${dateStr?.substring(0, 4)}-${dateStr?.substring(4, 6)}-${dateStr?.substring(6, 8)}`;

      if (!formattedData.has(date)) {
        formattedData.set(date, { date, desktop: 0, mobile: 0 });
      }

      const dayData = formattedData.get(date);
      if (device === 'desktop') {
        dayData.desktop += users;
      } else {
        dayData.mobile += users;
      }
    });

    const finalData = Array.from(formattedData.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('GA Data API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
