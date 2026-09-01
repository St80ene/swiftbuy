import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Business } from '../../business/entities/business.entity';
import { Product } from '../../products/entities/product.entity';

export const CATEGORY_SORT_FIELDS = {
  name: 'category.name',
  createdAt: 'category.created_at',
  updatedAt: 'category.updated_at',
} as const;

export const CATEGORY_SORT_FIELD_NAMES = [
  'name',
  'createdAt',
  'updatedAt',
] as const;

export type CategorySortField = (typeof CATEGORY_SORT_FIELD_NAMES)[number];

@Entity('categories')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'char', length: 36 })
  business_id!: string;

  @ManyToOne(() => Business, (business) => business.categories, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}
