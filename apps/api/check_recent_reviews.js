const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:test@localhost:5432/revenue_intel'
  });
  try {
    await client.connect();
    console.log('Connected to database.');
    const res = await client.query(`
      SELECT id, call_id, scorecard_id, total_score, original_score, is_reviewed, reviewer_notes, scored_at, updated_at 
      FROM call_scores 
      WHERE is_reviewed = true
      ORDER BY updated_at DESC
    `);
    console.log('Reviewed Call Scores:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

main();
