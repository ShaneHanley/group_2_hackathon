import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('failed_login_attempts')
@Index(['email', 'ipAddress'])
export class FailedLoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ default: 1 })
  attemptCount: number;

  @Column({ nullable: true })
  lockedUntil?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

