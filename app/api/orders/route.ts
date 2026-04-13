import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const filter = userId ? { userid: userId } : undefined;
    const orders = await supabase.from('order').select(filter);
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newOrder = await supabase.from('order').insert({
      id: `ORD-${Date.now()}`,
      userid: body.userId || 'admin-001',
      status: body.status || 'PENDING',
      subtotal: body.subtotal,
      deliveryfee: body.deliveryFee || 0,
      total: body.total,
      paymentmethod: body.paymentMethod || 'CASH',
      paymentstatus: body.paymentStatus || 'PENDING',
      deliveryaddress: body.deliveryAddress || 'Dine-In',
      items: body.items || [],
      createdat: new Date().toISOString(),
      deliveredat: body.status === 'DELIVERED' ? new Date().toISOString() : null,
    });
    return NextResponse.json(newOrder, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const updated = await supabase.from('order').update(id, rest);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('order').delete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
