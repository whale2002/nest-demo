import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Permission } from './Permission.entity';

@Entity({
  name: 'roles'
})
export class Role {
  @PrimaryGeneratedColumn({
    comment: '角色ID'
  })
  id: number;

  @Column({
    name: '角色名称',
    length: 20
  })
  name: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions'
  })
  permissions: Permission[];
}
