import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission, Role, User } from 'src/entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/RegisterUserDto';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils';
import { LoginUserVo, UserInfo } from './vo/LoginUserVo';
import { LoginUserDto } from './dto/LoginUserDto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private logger = new Logger();

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

  @InjectRepository(User) // 数据库操作对象
  private userRepository: Repository<User>;

  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);
    console.log(`邮箱为${user.email}的用户的验证码为: `, captcha);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (user.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username
    });

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }

    const newUser = new User();
    newUser.username = user.username;
    newUser.password = md5(user.password);
    newUser.email = user.email;
    newUser.nickName = user.nickName;

    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '注册失败';
    }
  }

  async login(loginUser: LoginUserDto, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUser.username,
        isAdmin
      },
      relations: ['roles', 'roles.permissions']
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.password !== md5(loginUser.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const loginVo = new LoginUserVo();
    loginVo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      headPic: user.headPic,
      createTime: user.createTime,
      updateTime: user.updateTime,
      isFrozen: user.isFrozen,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, [])
    };

    const token = this.generateToken(loginVo.userInfo);
    loginVo.accessToken = token.accessToken;
    loginVo.refreshToken = token.refreshToken;

    return loginVo;
  }

  async findUserById(userId: number, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isAdmin
      },
      relations: ['roles', 'roles.permissions']
    });

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles
        .map((item) => item.permissions)
        .reduce((a, b) => a.concat(b), [])
        .map((item) => item.code)
    };
  }

  async initData() {
    const user1 = new User();
    user1.username = 'admin';
    user1.password = md5('123456');
    user1.email = 'bjfuchin@gmail.com';
    user1.isAdmin = true;
    user1.nickName = '超级管理员';
    user1.phoneNumber = '13233323333';

    const user2 = new User();
    user2.username = 'normal-user';
    user2.password = md5('123456');
    user2.email = '1277180540@qq.com';
    user2.nickName = '普通用户';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }

  generateToken(userInfo: Partial<UserInfo>) {
    const accessToken = this.jwtService.sign(
      {
        userId: userInfo.id,
        username: userInfo.username,
        roles: userInfo.roles,
        permissions: userInfo.permissions
      },
      {
        expiresIn:
          this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_TIME') || '30m'
      }
    );

    const refreshToken = this.jwtService.sign(
      {
        userId: userInfo.id
      },
      {
        expiresIn:
          this.configService.get('JWT_REFRESH_TOKEN_EXPRES_TIME') || '7d'
      }
    );

    return {
      accessToken,
      refreshToken
    };
  }
}
