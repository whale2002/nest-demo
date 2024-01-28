import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Role } from './Role.entity';

@Entity({
  name: 'users'
})
export class User {
  @PrimaryGeneratedColumn({
    comment: '用户ID'
  })
  id: number;

  @Column({
    comment: '用户名',
    length: 50
  })
  username: string;

  @Column({
    comment: '密码',
    length: 50
  })
  password: string;

  @Column({
    name: 'nick_name',
    length: 50,
    comment: '昵称'
  })
  nickName: string;

  @Column({
    comment: '邮箱',
    length: 50
  })
  email: string;

  @Column({
    comment: '头像',
    length: 100,
    nullable: true
  })
  headPic: string;

  @Column({
    comment: '手机号',
    length: 100,
    nullable: true
  })
  phoneNumber: string;

  @Column({
    comment: '是否被冻结',
    default: false
  })
  isFrozen: boolean;

  @Column({
    comment: '是否是管理员',
    default: false
  })
  isAdmin: boolean;

  @CreateDateColumn({
    comment: '创建时间'
  })
  createTime: Date;

  @CreateDateColumn({
    comment: '更新时间'
  })
  updateTime: Date;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles'
  })
  roles: Role[];
}
