import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  try {
    const client = await pool.connect();
    
    let query = `
      SELECT 
        id,
        kuvera_code,
        scheme_name,
        fund_house_name,
        fund_category,
        fund_type,
        returns_1d,
        returns_1w,
        returns_1y,
        returns_3y,
        returns_5y,
        returns_inception,
        total_score,
        aum,
        expense_ratio,
        fund_rating,
        last_updated,
        fund_house
      FROM funds
      WHERE total_score IS NOT NULL
    `;
    
    const params = [];
    
    if (category && category !== 'all') {
      if (category === 'hybrid') {
        query += ` AND fund_type ILIKE '%hybrid%'`;
      } else {
        // For equity categories: Large Cap, Mid Cap, Small Cap, Flexi Cap, ELSS
        query += ` AND fund_type ILIKE '%equity%' AND fund_category = $1`;
        params.push(category);
      }
    }
    
    query += ` ORDER BY total_score DESC`;
    
    const result = await client.query(query, params);
    client.release();
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch funds data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
