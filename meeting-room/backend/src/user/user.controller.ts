import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  Query,
  UnauthorizedException,
  DefaultValuePipe,
  HttpStatus
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/RegisterUserDto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/LoginUserDto';
import { JwtService } from '@nestjs/jwt';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UserInfoVo } from './vo/UserInfoVo';
import { UpdataUserPasswordDto } from './dto/UpdataUserPasswordDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { generateParseIntPipe } from 'src/utils';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { LoginUserVo } from './vo/LoginUserVo';
import { UserListVo } from './vo/UserListVo';
import { RefreshTokenVo } from './vo/RefreshTokenVo';

@ApiTags('用户管理模块')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确/用户已存在',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String
  })
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    console.log(registerUser);
    return await this.userService.register(registerUser);
  }

  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和token',
    type: LoginUserVo
  })
  @Post('login')
  async login(@Body() loginUser: LoginUserDto) {
    const loginUserVo = await this.userService.login(loginUser, false);
    return loginUserVo;
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserInfoVo
  })
  @Get('info')
  @RequireLogin()
  async getUserInfo(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserInfoById(userId);

    const userInfoVo = new UserInfoVo();
    userInfoVo.id = user.id;
    userInfoVo.username = user.username;
    userInfoVo.email = user.email;
    userInfoVo.nickName = user.nickName;
    userInfoVo.headPic = user.headPic;
    userInfoVo.isFrozen = user.isFrozen;
    userInfoVo.createTime = user.createTime;
    return userInfoVo;
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'refreshToken',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token已失效，请重新登录!'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'token已刷新',
    type: RefreshTokenVo
  })
  @Get('refresh')
  @RequireLogin()
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserById(data.userId, false);

      return this.userService.generateToken(user);
    } catch (e) {
      throw new UnauthorizedException('token已失效，请重新登录!');
    }
  }

  @ApiQuery({
    name: 'address',
    type: String,
    required: true,
    example: 'xxx@xx.com'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8); // 随机生成6位数验证码

    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`
    });
    return '发送成功';
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'address',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  @RequireLogin()
  @Get('update_password/captcha')
  async getUpdatePasswordCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_password_captcha_${address}`,
      code,
      5 * 60
    );

    await this.emailService.sendMail({
      to: address,
      subject: '修改密码验证码',
      html: `<p>你的修改密码验证码是 ${code}</p>`
    });

    return '发送成功';
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'address',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  @Get('update/captcha')
  @RequireLogin()
  async updateCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_user_captcha_${address}`,
      code,
      10 * 60
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`
    });
    return '发送成功';
  }

  @ApiBearerAuth()
  @ApiBody({
    type: UpdataUserPasswordDto
  })
  @ApiResponse({
    description: '修改密码成功 | 修改密码失败',
    type: String
  })
  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdataUserPasswordDto
  ) {
    return await this.userService.updatePassword(userId, passwordDto);
  }

  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserDto
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: String
  })
  @Post(['update', 'admin/update'])
  @RequireLogin()
  async updateUserInfo(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return await this.userService.updata(userId, updateUserDto);
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    description: '用户ID',
    type: Number
  })
  @ApiResponse({
    type: String,
    description: 'success'
  })
  @Get('freeze')
  @RequireLogin()
  async freeze(@Query('id') useId: number) {
    await this.userService.freezeUserById(useId);

    return 'success';
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNo',
    type: Number,
    description: '第几页',
    example: 1
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    description: '每页显示的条数',
    example: 10
  })
  @ApiQuery({
    name: 'username',
    type: String,
    description: '用户名'
  })
  @ApiQuery({
    name: 'nickName',
    type: String,
    description: '昵称'
  })
  @ApiQuery({
    name: 'email',
    type: String,
    description: '邮箱'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户列表',
    type: UserListVo
  })
  @Get('users')
  @RequireLogin()
  async getUserList(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize')
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string
  ) {
    const { users, totalCount } = await this.userService.getUsersList(
      username,
      nickName,
      email,
      pageNo,
      pageSize
    );

    const userList = new UserListVo();
    userList.users = users;
    userList.totalCount = totalCount;

    return userList;
  }

  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和token',
    type: LoginUserVo
  })
  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const loginUserVo = await this.userService.login(loginUser, true);
    return loginUserVo;
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'refreshToken',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token已失效，请重新登录!'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'token已刷新',
    type: RefreshTokenVo
  })
  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserById(data.userId, true);

      return this.userService.generateToken(user);
    } catch (e) {
      throw new UnauthorizedException('token已失效，请重新登录!');
    }
  }

  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }
}
