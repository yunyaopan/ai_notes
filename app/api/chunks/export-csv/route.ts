import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTextChunks } from '@/lib/api/database';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all text chunks for the user
    const chunks = await getUserTextChunks(user.id);
    
    // Convert to CSV format
    const csvHeader = 'Content,Category,Emotional Intensity,Importance,Created At,Updated At\n';
    const csvRows = chunks.map(chunk => {
      const content = `"${(chunk.content || '').replace(/"/g, '""')}"`; // Escape quotes in CSV
      const category = chunk.category || '';
      const emotionalIntensity = chunk.emotional_intensity || '';
      const importance = chunk.importance || '';
      const createdAt = chunk.created_at || '';
      const updatedAt = chunk.updated_at || '';
      
      return `${content},${category},${emotionalIntensity},${importance},${createdAt},${updatedAt}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Return CSV file as response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="mindsort-notes-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export CSV API error:', error);
    return NextResponse.json(
      { error: 'Failed to export notes' },
      { status: 500 }
    );
  }
}

