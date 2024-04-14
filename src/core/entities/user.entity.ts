import { randomBytes } from 'crypto';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'user_id',
  })
  id: number;

  @Column({
    name: 'email_address',
    nullable: false,
    default: '',
    unique: true,
  })
  email: string;

  @Column({
    name: 'access_key',
    nullable: true,
  })
  accessKey: string = randomBytes(16).toString('hex');

  @Column({
    name: 'rate_limit',
    type: 'int',
    nullable: true,
    default: null,
  })
  rateLimit: number;

  @Column({
    name: 'key_expiration',
    type: 'timestamp with time zone',
    nullable: true,
    default: null,
  })
  keyExpiration: Date;

  @Column({
    name: 'is_key_active',
    type: 'boolean',
    default: true,
  })
  isKeyActive: boolean;
}
