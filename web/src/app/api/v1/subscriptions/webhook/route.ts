import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { subscriptionsService } from '@/lib/api/services/subscriptions.service';

/**
 * RevenueCat webhook receiver.
 * NO auth middleware — this is called by RevenueCat, not by users.
 * Uses a simple webhook secret check instead.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedKey = process.env.REVENUECAT_WEBHOOK_AUTH_KEY;

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { message: 'Unauthorized', statusCode: 401, timestamp: new Date().toISOString() },
        { status: 401 },
      );
    }

    const body = await req.json();
    const event = body.event;

    if (!event?.type || !event?.app_user_id) {
      console.warn('Malformed RevenueCat webhook payload');
      return NextResponse.json(
        { data: { ok: true }, statusCode: 200, timestamp: new Date().toISOString() },
        { status: 200 },
      );
    }

    await subscriptionsService.handleWebhook(event);

    return NextResponse.json(
      { data: { ok: true }, statusCode: 200, timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    console.error('Subscription webhook error:', error);
    return NextResponse.json(
      { message: 'Internal server error', statusCode: 500, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
