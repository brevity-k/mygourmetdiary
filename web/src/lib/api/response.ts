import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { data, statusCode: status, timestamp: new Date().toISOString() },
    { status },
  );
}

export function apiError(message: string, status: number) {
  return NextResponse.json(
    { message, statusCode: status, timestamp: new Date().toISOString() },
    { status },
  );
}
