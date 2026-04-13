import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const partnerId = searchParams.get('partnerId');

    const whereClause: { userId?: string; deliveryPartnerId?: string } = {};
    if (userId) whereClause.userId = userId;
    if (partnerId) whereClause.deliveryPartnerId = partnerId;

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: { menuItem: true }
        },
        user: {
          select: { name: true, email: true, phone: true }
        },
        deliveryPartner: {
          select: { name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to read orders data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const newOrder = await prisma.order.create({
      data: {
        id: uuidv4(),
        userId: body.userId,
        deliveryAddress: body.deliveryAddress || 'Dine-In',
        subtotal: body.subtotal,
        deliveryFee: body.deliveryFee || 0,
        total: body.total,
        paymentMethod: body.paymentMethod || 'COD',
        paymentStatus: body.paymentStatus || 'PENDING',
        status: body.status || 'PENDING',
        deliveredAt: body.status === 'DELIVERED' ? new Date() : null,
        items: {
          create: body.items.map((item: { id: number; price: number; quantity: number }) => ({
            id: uuidv4(),
            menuItemId: item.id,
            price: item.price,
            quantity: item.quantity
          }))
        }
      },
      include: { items: true }
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create order', details: String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updatedOrder = await prisma.order.update({
      where: { id: id.toString() },
      data: updateData
    });

    return NextResponse.json(updatedOrder);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.order.delete({ where: { id: id.toString() } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
