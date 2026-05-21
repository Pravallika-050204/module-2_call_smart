const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:test@localhost:5432/revenue_intel'
  });
  try {
    await client.connect();
    console.log('Connected to database.');
    const res = await client.query(`
      SELECT id, call_id, scorecard_id, total_score, is_reviewed, original_score, reviewer_notes, scored_at 
      FROM call_scores 
      WHERE call_id IN ('call-107', 'call-113', 'call-143')
      ORDER BY call_id, scored_at DESC
    `);
    console.log('Call Scores for specific calls:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

main();
