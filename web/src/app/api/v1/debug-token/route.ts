import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  return NextResponse.json({
    hasAuth: !!auth,
    authPrefix: auth ? auth.substring(0, 30) : null,
    authLength: auth?.length ?? 0,
  });
}
