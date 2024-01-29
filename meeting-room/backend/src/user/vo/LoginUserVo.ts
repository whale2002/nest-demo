import { ApiProperty } from '@nestjs/swagger';

export class UserInfo {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'qhy' })
  username: string;

  @ApiProperty({ example: 'qhy' })
  nickName: string;

  @ApiProperty({ example: 'xxx@xx.com' })
  email: string;

  @ApiProperty({ example: 'abc.png' })
  headPic: string;

  @ApiProperty({ example: '13800000000' })
  phoneNumber: string;

  @ApiProperty({ example: true })
  isFrozen: boolean;

  @ApiProperty({ example: false })
  isAdmin: boolean;

  @ApiProperty()
  createTime: Date;

  @ApiProperty()
  updateTime: Date;

  @ApiProperty({ example: ['管理员'] })
  roles: string[];

  @ApiProperty({ example: ['/user'] })
  permissions: string[];
}

export class LoginUserVo {
  @ApiProperty()
  userInfo: UserInfo;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
