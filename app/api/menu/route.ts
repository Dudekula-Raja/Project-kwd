import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const items = await supabase.from('menuitem').select();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newItem = await supabase.from('menuitem').insert({
      nameen: body.nameEn,
      namear: body.nameAr,
      descriptionen: body.descriptionEn,
      descriptionar: body.descriptionAr,
      price: body.price,
      image: body.image,
      category: body.category,
      isveg: body.isVeg || false,
      isbestseller: body.isBestseller || false,
      isspicy: body.isSpicy || false,
      badge: body.badge || null,
      rating: body.rating || 5.0,
      reviews: body.reviews || 0,
    });
    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const updated = await supabase.from('menuitem').update(id, {
      nameen: rest.nameEn,
      namear: rest.nameAr,
      descriptionen: rest.descriptionEn,
      descriptionar: rest.descriptionAr,
      price: rest.price,
      image: rest.image,
      category: rest.category,
      isveg: rest.isVeg,
      isbestseller: rest.isBestseller,
      isspicy: rest.isSpicy,
      badge: rest.badge,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('menuitem').delete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
