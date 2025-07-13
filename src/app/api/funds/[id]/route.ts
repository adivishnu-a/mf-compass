import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: any, context: any) {
  try {
    const client = await pool.connect();
    const params = await context.params;
    const { id } = params;
    const query = `
      SELECT 
        *,
        to_char(current_nav_date, 'YYYY-MM-DD HH24:MI:SS.US') as current_nav_date_str,
        to_char(returns_date, 'YYYY-MM-DD HH24:MI:SS.US') as returns_date_str,
        to_char(start_date, 'YYYY-MM-DD HH24:MI:SS.US') as start_date_str,
        to_char(score_updated, 'YYYY-MM-DD HH24:MI:SS.US') as score_updated_str,
        to_char(last_updated, 'YYYY-MM-DD HH24:MI:SS.US') as last_updated_str
      FROM funds
      WHERE kuvera_code = $1
    `;
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...result.rows[0],
        current_nav_date: result.rows[0].current_nav_date_str,
        returns_date: result.rows[0].returns_date_str,
        start_date: result.rows[0].start_date_str,
        score_updated: result.rows[0].score_updated_str,
        last_updated: result.rows[0].last_updated_str,
      }
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch fund details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
