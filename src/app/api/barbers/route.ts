import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const branch_id = searchParams.get('branch_id')

  const supabase = createServiceClient()

  let query = supabase
    .from('barbers')
    .select('*, branch:branches(id, name)')
    .eq('is_active', true)
    .order('display_order')
    .order('name')

  if (branch_id) query = query.eq('branch_id', branch_id)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
