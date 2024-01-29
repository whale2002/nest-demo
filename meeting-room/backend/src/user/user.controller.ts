import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  Query,
  UnauthorizedException,
  DefaultValuePipe
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
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    console.log(registerUser);
    return await this.userService.register(registerUser);
  }

  @Post('login')
  async login(@Body() loginUser: LoginUserDto) {
    const loginUserVo = await this.userService.login(loginUser, false);
    return loginUserVo;
  }

  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const loginUserVo = await this.userService.login(loginUser, true);
    return loginUserVo;
  }

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

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserById(data.userId, false);

      return this.userService.generateToken(user);
    } catch (e) {
      throw new UnauthorizedException('token已失效，请重新登录!');
    }
  }

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

  @Get('get-captcha')
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

  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

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

  @Get('update/captcha')
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

  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdataUserPasswordDto
  ) {
    return await this.userService.updatePassword(userId, passwordDto);
  }

  @Post(['update', 'admin/update'])
  @RequireLogin()
  async updateUserInfo(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return await this.userService.updata(userId, updateUserDto);
  }

  @Get('freeze')
  @RequireLogin()
  async freeze(@Query('id') useId: number) {
    await this.userService.freezeUserById(useId);

    return 'success';
  }

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
    return await this.userService.getUsersList(
      username,
      nickName,
      email,
      pageNo,
      pageSize
    );
  }
}
