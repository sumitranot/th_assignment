-- Create both development and test databases if they don't already exist
SELECT 'CREATE DATABASE document_workflow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'document_workflow')\gexec

SELECT 'CREATE DATABASE document_workflow_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'document_workflow_test')\gexec
