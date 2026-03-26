"""Fix company field and add ISO compliance fields"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'  # FIXED: Changed from '002' to '001'
down_revision = None  # CHANGED: This is the FIRST migration
branch_labels = None
depends_on = None

def upgrade():
    # Connect to the database
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if company column exists in users table
    users_columns = inspector.get_columns('users')
    column_names = [column['name'] for column in users_columns]
    
    # Only add company column if it doesn't exist
    if 'company' not in column_names:
        op.add_column('users', sa.Column('company', sa.String(), nullable=True))
    
    # Check ISO compliance fields in projects table
    projects_columns = inspector.get_columns('projects')
    column_names = [column['name'] for column in projects_columns]
    
    # Add ISO compliance fields if they don't exist
    if 'goal_and_scope' not in column_names:
        op.add_column('projects', sa.Column('goal_and_scope', sa.Text(), nullable=True))
    
    if 'functional_unit' not in column_names:
        op.add_column('projects', sa.Column('functional_unit', sa.String(), nullable=True))
    
    if 'system_boundary_justification' not in column_names:
        op.add_column('projects', sa.Column('system_boundary_justification', sa.Text(), nullable=True))
    
    if 'allocation_method' not in column_names:
        op.add_column('projects', sa.Column('allocation_method', sa.String(), nullable=True))
    
    if 'cutoff_criteria' not in column_names:
        op.add_column('projects', sa.Column('cutoff_criteria', sa.String(), nullable=True))
    
    if 'data_quality_requirements' not in column_names:
        op.add_column('projects', sa.Column('data_quality_requirements', sa.Text(), nullable=True))
    
    # Check uncertainty fields in process_data table
    process_columns = inspector.get_columns('process_data')
    column_names = [column['name'] for column in process_columns]
    
    # Add uncertainty fields if they don't exist
    if 'co2_lower_bound' not in column_names:
        op.add_column('process_data', sa.Column('co2_lower_bound', sa.Float(), nullable=True))
    
    if 'co2_upper_bound' not in column_names:
        op.add_column('process_data', sa.Column('co2_upper_bound', sa.Float(), nullable=True))
    
    if 'prediction_confidence' not in column_names:
        op.add_column('process_data', sa.Column('prediction_confidence', sa.Float(), nullable=True))
    
    # Add JSON columns for full uncertainty data
    if 'uncertainty_data' not in column_names:
        op.add_column('process_data', sa.Column('uncertainty_data', postgresql.JSON(), nullable=True))
    
    if 'model_metadata' not in column_names:
        op.add_column('process_data', sa.Column('model_metadata', postgresql.JSON(), nullable=True))

def downgrade():
    # Check and drop columns safely
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check process_data table
    columns = inspector.get_columns('process_data')
    column_names = [column['name'] for column in columns]
    
    if 'model_metadata' in column_names:
        op.drop_column('process_data', 'model_metadata')
    if 'uncertainty_data' in column_names:
        op.drop_column('process_data', 'uncertainty_data')
    if 'prediction_confidence' in column_names:
        op.drop_column('process_data', 'prediction_confidence')
    if 'co2_upper_bound' in column_names:
        op.drop_column('process_data', 'co2_upper_bound')
    if 'co2_lower_bound' in column_names:
        op.drop_column('process_data', 'co2_lower_bound')
    
    # Check projects table
    columns = inspector.get_columns('projects')
    column_names = [column['name'] for column in columns]
    
    if 'data_quality_requirements' in column_names:
        op.drop_column('projects', 'data_quality_requirements')
    if 'cutoff_criteria' in column_names:
        op.drop_column('projects', 'cutoff_criteria')
    if 'allocation_method' in column_names:
        op.drop_column('projects', 'allocation_method')
    if 'system_boundary_justification' in column_names:
        op.drop_column('projects', 'system_boundary_justification')
    if 'functional_unit' in column_names:
        op.drop_column('projects', 'functional_unit')
    if 'goal_and_scope' in column_names:
        op.drop_column('projects', 'goal_and_scope')
    
    # Check users table
    columns = inspector.get_columns('users')
    column_names = [column['name'] for column in columns]
    
    if 'company' in column_names:
        op.drop_column('users', 'company')