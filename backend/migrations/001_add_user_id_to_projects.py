"""
Migration to add user_id to projects table and create uploaded_files table
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Add user_id column to projects table
    op.add_column('projects', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint (temporarily nullable)
    op.create_foreign_key(
        'fk_projects_user_id', 
        'projects', 
        'users', 
        ['user_id'], 
        ['id'],
        ondelete='CASCADE'
    )
    
    # Update existing projects to have a user (assign to first user or admin)
    op.execute("UPDATE projects SET user_id = (SELECT id FROM users LIMIT 1)")
    
    # Now make user_id non-nullable
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
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('rows_processed', sa.Integer(), nullable=True),
        sa.Column('columns_processed', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=True, server_default='uploaded'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_uploaded_files_id'), 'uploaded_files', ['id'], unique=False)
    op.create_index(op.f('ix_uploaded_files_user_id'), 'uploaded_files', ['user_id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_uploaded_files_user_id'), table_name='uploaded_files')
    op.drop_index(op.f('ix_uploaded_files_id'), table_name='uploaded_files')
    op.drop_table('uploaded_files')
    op.drop_constraint('fk_projects_user_id', 'projects', type_='foreignkey')
    op.drop_column('projects', 'user_id')