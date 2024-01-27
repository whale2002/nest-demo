import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'permissions'
})
export class Permission {
  @PrimaryGeneratedColumn({
    comment: '权限ID'
  })
  id: number;

  @Column({
    comment: '权限代码',
    length: 20
  })
  code: string;

  @Column({
    comment: '权限描述',
    length: 100
  })
  description: string;
}
