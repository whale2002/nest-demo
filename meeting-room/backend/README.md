# meeting-system-backend

## 环境变量配置

创建 src/.env 文件

```
# nest
NEST_POST= # 端口

# mysql
DATABASE_HOST= # mysql 主机
DATABASE_PORT=3306 # mysql 端口
DATABASE_USERNAME= # mysql 用户名
DATABASE_PASSWORD=123456 # mysql 密码
DATABASE_DATABASE= # mysql 数据库名

# redis
REDIS_HOST= # redis 主机
REDIS_PORT=6379 # redis 端口
REDIS_PASSWORD= # redis 密码
REDIS_DB= # redis 数据库

# email
EMAIL_SERVER= # 邮箱服务器
EMAIL_POST= # 邮箱服务器端口号
EMAIL_SENDER= # 发送邮箱
EMAIL_CODE= # 发送邮箱的授权码
```
