#!/usr/bin/env python3
"""
Setup database migration for user isolation
"""
import os
import sys

def run_migration():
    print("=== Setting up User Isolation Migration ===")
    
    # 1. Create alembic directory structure
    os.makedirs("alembic/versions", exist_ok=True)
    
    # 2. Initialize alembic if not exists
    if not os.path.exists("alembic.ini"):
        print("Initializing Alembic...")
        os.system("alembic init alembic")
    
    # 3. Update alembic.ini with correct database URL
    with open("alembic.ini", "r") as f:
        content = f.read()
    
    # Update the sqlalchemy.url
    content = content.replace(
        "sqlalchemy.url = driver://user:pass@localhost/dbname",
        "sqlalchemy.url = postgresql://ecometal_user:ecometal123@localhost:5432/ecometal_lca"
    )
    
    with open("alembic.ini", "w") as f:
        f.write(content)
    
    print("✅ Alembic configured")
    
    # 4. Create the migration file
    migration_content = '''
"""Add user_id to projects and create uploaded_files table

Revision ID: 001
Revises: 
Create Date: 2025-01-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add company to users
    op.add_column('users', sa.Column('company', sa.String(), nullable=True))
    
    # Add user_id to projects (nullable first)
    op.add_column('projects', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Create foreign key
    op.create_foreign_key(
        'fk_projects_user_id',
        'projects',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )
    
    # Assign existing projects to first user
    op.execute("""
        UPDATE projects 
        SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1)
        WHERE user_id IS NULL
    """)
    
    # Make user_id required
    op.alter_column('projects', 'user_id', nullable=False)
    
    # Create uploaded_files table
    op.create_table('uploaded_files',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('rows_processed', sa.Integer(), nullable=True),
        sa.Column('columns_processed', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), server_default=sa.text("'uploaded'")),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_uploaded_files_id', 'uploaded_files', ['id'], unique=False)
    op.create_index('ix_uploaded_files_user_id', 'uploaded_files', ['user_id'], unique=False)


def downgrade():
    op.drop_index('ix_uploaded_files_user_id', table_name='uploaded_files')
    op.drop_index('ix_uploaded_files_id', table_name='uploaded_files')
    op.drop_table('uploaded_files')
    op.drop_constraint('fk_projects_user_id', 'projects', type_='foreignkey')
    op.drop_column('projects', 'user_id')
    op.drop_column('users', 'company')
'''
    
    with open("alembic/versions/001_add_user_isolation.py", "w") as f:
        f.write(migration_content)
    
    print("✅ Migration file created")
    
    # 5. Run the migration
    print("\nRunning migration...")
    os.system("alembic upgrade head")
    
    print("\n✅ Migration completed successfully!")
    print("\nNext steps:")
    print("1. Restart backend: uvicorn app.main:app --reload")
    print("2. Restart frontend: npm run dev")
    print("3. Login with different accounts to see isolated projects")

if __name__ == "__main__":
    run_migration()