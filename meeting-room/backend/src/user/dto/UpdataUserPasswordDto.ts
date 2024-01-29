import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class UpdataUserPasswordDto {
  @IsNotEmpty({
    message: '密码为空!'
  })
  @MinLength(6, {
    message: '密码长度不能小于6位!'
  })
  password: string;

  @IsNotEmpty({
    message: '邮箱为空!'
  })
  @IsEmail(
    {},
    {
      message: '邮箱格式错误!'
    }
  )
  email: string;

  @IsNotEmpty({
    message: '验证码为空!'
  })
  captcha: string;
}
