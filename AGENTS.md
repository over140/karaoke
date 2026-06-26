# Karaoke Project

本目录是练习唱歌的静态网页项目，后续可部署到 GitHub Pages。

## 工作原则

1. 默认使用中文说明改动。
2. 默认只做本地文件修改和本地验证。
3. 除非用户明确说“部署”“推送到 GitHub”“上线”“发布”或同等意思，不要执行 `git commit`、`git push`、创建 PR、修改 GitHub Pages 设置或触发远端部署。
4. 用户只要求“修改”“优化”“写代码”“检查”时，不自动部署。
5. 可以读取本项目的 Git 状态来理解改动范围，但不要因为有远端仓库就主动发布。
6. 音频和歌词都作为静态资源处理；公开发布前提醒确认版权和发布范围。

## 目录约定

```text
index.html                # 歌曲列表页
player.html               # 歌曲播放页
styles.css                # 页面样式
app.js                    # 播放、歌词同步和页面交互
assets/songs.json         # 静态歌曲清单
assets/audio/             # 音频文件
assets/lyrics/            # LRC 歌词文件
.github/workflows/        # GitHub Pages 部署 workflow，仅在明确部署时使用
```

## 完成标准

- 本地改动范围清楚。
- 关键静态数据格式通过校验。
- 播放相关改动至少检查 `app.js` 语法。
- 如未明确要求部署，最终回复说明“未提交、未推送、未部署”。
