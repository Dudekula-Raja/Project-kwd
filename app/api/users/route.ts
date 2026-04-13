import { NextResponse } from 'next/server';

// Since we use credentials-based auth with a single hardcoded admin,
// this endpoint returns a static admin user list for the admin dashboard.
export async function GET() {
  return NextResponse.json([
    {
      id: 'admin-001',
      name: 'Biryani Spot Admin',
      email: 'biryanispot.kwt@gmail.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: null,
      createdAt: new Date().toISOString(),
      _count: { orders: 0 }
    }
  ]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    // Return a mock walk-in user with a random ID
    const randomId = Math.random().toString(36).substring(2, 10);
    return NextResponse.json({
      id: `walkin-${randomId}`,
      name: body.name,
      email: `walkin.${randomId}@biryanispot.local`,
      role: 'USER',
      status: 'ACTIVE'
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create walk-in user' }, { status: 500 });
  }
}
