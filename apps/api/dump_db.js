const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:test@localhost:5432/revenue_intel'
  });
  try {
    await client.connect();
    console.log('Connected to database.');
    const res = await client.query('SELECT * FROM call_scores');
    console.log('All Call Scores in database:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

main();
