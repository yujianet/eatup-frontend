# 使用 Node.js 官方镜像作为构建环境
FROM node:20-alpine AS build-stage

# 设置工作目录
WORKDIR /app

# 复制项目源代码
COPY . .

# 安装项目依赖
RUN npm install

# 构建 Vue 项目
RUN npm run build

# 使用 Nginx 镜像作为生产环境
FROM nginx:alpine AS production-stage

# 复制构建好的文件到 Nginx 的默认目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx 并指定配置文件
CMD ["nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]