import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveKeycloakColumns1734567890000 implements MigrationInterface {
  name = 'RemoveKeycloakColumns1734567890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if keycloak_id column exists in users table before dropping
    const usersTable = await queryRunner.getTable('users');
    const keycloakIdColumn = usersTable?.findColumnByName('keycloak_id');
    
    if (keycloakIdColumn) {
      await queryRunner.dropColumn('users', 'keycloak_id');
      console.log('✅ Dropped keycloak_id column from users table');
    } else {
      console.log('ℹ️  keycloak_id column does not exist in users table (already removed)');
    }

    // Check if keycloak_role_id column exists in roles table before dropping
    const rolesTable = await queryRunner.getTable('roles');
    const keycloakRoleIdColumn = rolesTable?.findColumnByName('keycloak_role_id');
    
    if (keycloakRoleIdColumn) {
      await queryRunner.dropColumn('roles', 'keycloak_role_id');
      console.log('✅ Dropped keycloak_role_id column from roles table');
    } else {
      console.log('ℹ️  keycloak_role_id column does not exist in roles table (already removed)');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add keycloak_id column to users table
    const usersTable = await queryRunner.getTable('users');
    const keycloakIdColumn = usersTable?.findColumnByName('keycloak_id');
    
    if (!keycloakIdColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'keycloak_id',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
      console.log('✅ Re-added keycloak_id column to users table');
    }

    // Re-add keycloak_role_id column to roles table
    const rolesTable = await queryRunner.getTable('roles');
    const keycloakRoleIdColumn = rolesTable?.findColumnByName('keycloak_role_id');
    
    if (!keycloakRoleIdColumn) {
      await queryRunner.addColumn(
        'roles',
        new TableColumn({
          name: 'keycloak_role_id',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
      console.log('✅ Re-added keycloak_role_id column to roles table');
    }
  }
}

