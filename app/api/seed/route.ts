import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import menuData from '@/data/menu.json';

export async function GET() {
  try {
    let seeded = 0;
    for (const item of menuData as any[]) {
      try {
        await supabase.from('menuitem').insert({
          nameen: item.nameEn,
          namear: item.nameAr,
          descriptionen: item.descriptionEn,
          descriptionar: item.descriptionAr,
          price: item.price,
          image: item.image,
          category: item.category,
          isveg: item.isVeg || false,
          isbestseller: item.isBestseller || false,
          isspicy: item.isSpicy || false,
          badge: item.badge || null,
          rating: item.rating || 5.0,
          reviews: item.reviews || 0,
        });
        seeded++;
      } catch {
        // skip duplicates
      }
    }
    return NextResponse.json({ success: true, seeded });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
