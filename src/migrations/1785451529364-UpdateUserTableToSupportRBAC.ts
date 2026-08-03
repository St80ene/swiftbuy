import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class UpdateUserTableToSupportRBAC1785451529364 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * Rename role -> role_id
     *
     * This preserves existing data. A later migration will convert
     * the column to a UUID foreign key once the roles table exists.
     */
    await queryRunner.renameColumn('users', 'role', 'role_id');

    /**
     * Create user_auth table
     */
    await queryRunner.createTable(
      new Table({
        name: 'user_auth',
        columns: [
          /**
           * Identity
           */
          {
            name: 'user_id',
            type: 'char',
            length: '36',
            isPrimary: true,
          },

          /**
           * Authentication
           */
          {
            name: 'password',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: true,
          },

          /**
           * Password Reset
           */
          {
            name: 'password_reset_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'password_reset_expires_at',
            type: 'datetime',
            isNullable: true,
          },

          /**
           * Email Verification
           */
          {
            name: 'is_email_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'email_verification_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'email_verification_expires_at',
            type: 'datetime',
            isNullable: true,
          },

          /**
           * Security
           */
          {
            name: 'failed_login_attempts',
            type: 'int',
            default: 0,
            isNullable: true,
          },
          {
            name: 'locked_until',
            type: 'datetime',
            isNullable: true,
          },

          /**
           * Audit
           */
          {
            name: 'last_login_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'last_login_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },

          /**
           * Timestamps
           */
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    /**
     * user_auth.user_id -> users.id
     */
    await queryRunner.createForeignKey(
      'user_auth',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_auth');

    if (table) {
      const foreignKey = table.foreignKeys.find((fk) =>
        fk.columnNames.includes('user_id'),
      );

      if (foreignKey) {
        await queryRunner.dropForeignKey('user_auth', foreignKey);
      }
    }

    await queryRunner.dropTable('user_auth');

    /**
     * Restore original column name
     */
    await queryRunner.renameColumn('users', 'role_id', 'role');
  }
}
