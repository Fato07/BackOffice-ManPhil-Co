-- Test migration to verify migration system is working
CREATE TABLE IF NOT EXISTS test_migration_table (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  test_value TEXT
);

-- Insert a test record to confirm migration ran
INSERT INTO test_migration_table (test_value) 
VALUES ('Migration system is working!');