# Alembic Directory

This directory contains database migration scripts and configuration for the MCP Router project using Alembic.

## Contents

- **versions/**: Migration script versions
- **env.py**: Alembic environment configuration
- **script.py.mako**: Template for generating migration scripts
- **README**: Original Alembic README file

## Purpose

Alembic is used for:
- Managing database schema migrations
- Tracking changes to database models over time
- Providing version control for database schemas
- Enabling rollback of database changes
- Supporting multiple database engines

## Usage

### Creating a New Migration

```bash
# Generate a new migration script
alembic revision -m "description of changes"
```

### Running Migrations

```bash
# Upgrade to the latest version
alembic upgrade head

# Upgrade to a specific version
alembic upgrade <revision>

# Downgrade to a previous version
alembic downgrade <revision>

# Downgrade one version
alembic downgrade -1
```

### Checking Migration Status

```bash
# Show current revision
alembic current

# Show migration history
alembic history
```

## Integration with MCP Router

The database migrations support:
- User authentication and authorization
- Server registration and discovery
- Request logging and analytics
- Configuration storage
- Workflow persistence

## Configuration

The migration environment is configured in `env.py` and uses the database URL specified in the application configuration or environment variables. 