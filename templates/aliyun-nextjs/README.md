# 阿里云 Next.js 自动部署模板

这套模板用于把新的小型 Next.js 项目快速接入：

- GitHub Actions 自动触发
- 阿里云轻量服务器执行部署
- PM2 常驻
- Nginx 反向代理

## 一键部署流程

1. 在 GitHub 新建仓库。
2. 选择项目端口，准备好 PM2 进程名。
3. 复制本模板中的 `deploy.sh.template`、`deploy-aliyun.yml.template`、`first-deploy.sh.template`。
4. 替换模板变量：
   - `{{PROJECT_NAME}}`
   - `{{PROJECT_PATH}}`
   - `{{BRANCH}}`
   - `{{PM2_NAME}}`
   - `{{PORT}}`
   - `{{REPO_URL}}` 仅首次初始化脚本需要
5. 在 GitHub 仓库里配置 Secrets：
   - `ALIYUN_HOST`
   - `ALIYUN_USER`
   - `ALIYUN_PORT`
   - `ALIYUN_SSH_KEY`
6. 将生成的 `deploy.sh` 放到服务器项目目录。
7. 将生成的 workflow 放到 `.github/workflows/deploy-aliyun.yml`。
8. 首次 push 后自动触发部署。
9. 以后每次 push 到指定分支，GitHub Actions 自动登录阿里云并执行 `bash deploy.sh`。

## 推荐目录结构

```text
/www/wwwroot/<project>
├─ deploy.sh
├─ ecosystem.config.js
├─ .github/workflows/deploy-aliyun.yml
├─ package.json
└─ ...
```

## 说明

- `deploy.sh` 负责常规更新：拉代码、安装依赖、构建、重启 PM2。
- `first-deploy.sh` 负责首次初始化：目录不存在时自动克隆仓库并启动 PM2。
- Nginx 只负责把公网入口反向代理到本地 `3000` 或你的目标端口。
