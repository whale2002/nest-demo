import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinColumn
} from 'typeorm';
import { Permission } from './Permission';

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
  @JoinColumn({
    name: 'role_permissions'
  })
  permission: Permission[];
}
