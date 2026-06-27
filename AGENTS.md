# Karaoke Project

本目录是练习唱歌的静态网页项目，后续可部署到 GitHub Pages。

## 工作原则

1. 默认使用中文说明改动。
2. 默认只做本地文件修改和本地验证。
3. 除非用户明确说“部署”“推送到 GitHub”“上线”“发布”或同等意思，不要执行 `git commit`、`git push`、创建 PR、修改 GitHub Pages 设置或触发远端部署。
4. 用户只要求“修改”“优化”“写代码”“检查”时，不自动部署。
5. 可以读取本项目的 Git 状态来理解改动范围，但不要因为有远端仓库就主动发布。
6. 音频和歌词都作为静态资源处理；公开发布前提醒确认版权和发布范围。

## 新增歌曲流程

用户给出一个含音频文件（.mp3）的目录路径时，自动按以下步骤处理，无需逐步确认：

1. **命名**：读取 MP3 ID3 标签中的 `artist` 和 `title`；若无标签，从文件名提取。中文艺术家/歌名转拼音，格式为 `{artist-pinyin}-{title-pinyin}`（全小写，空格用连字符）。
2. **复制音频**：先检查 MP3 是否有 Xing/Info header（`python3 -c "data=open(f,'rb').read(8192); print(b'Xing' in data or b'Info' in data)"`）；若无，用 `ffmpeg -y -i {src} -vn -c:a libmp3lame -b:a 320k -write_xing 1 {dst}` 重新编码后复制，否则直接复制。缺少该 header 会导致浏览器无法获取 duration，进度条不可拖动。
3. **提取封面**：用 `ffmpeg -y -i {src} -an -vcodec copy -update 1 assets/covers/{id}.jpg` 提取内嵌封面；若提取失败或无封面，跳过并在最后说明。
4. **处理歌词**：若源目录有同名 `.lrc` 文件，先检测编码（`file --mime-encoding`），若非 UTF-8 则用 `iconv -f GBK -t UTF-8` 转换后再复制到 `assets/lyrics/{id}.lrc`；否则说明缺失，不自动生成。
5. **更新清单**：在 `assets/songs.json` 末尾追加条目，字段为 `id / title / artist / cover / audio / lyrics`，路径格式与现有条目一致。
6. **完成确认**：列出已处理的文件和 songs.json 变更；提示是否需要提交推送。
7. **版权提示**：在列出结果时提醒确认版权和发布范围，尤其是推送到公开仓库前。

## 目录约定

```text
index.html                # 歌曲列表页
player.html               # 歌曲播放页
styles.css                # 页面样式
app.js                    # 播放、歌词同步和页面交互
assets/songs.json         # 静态歌曲清单
assets/audio/             # 音频文件
assets/covers/            # 封面图片
assets/lyrics/            # LRC 歌词文件
.github/workflows/        # GitHub Pages 部署 workflow，仅在明确部署时使用
```

## 本地调试

- 本地服务器必须用 `npx serve -p 8080 .`，**不要用 `python3 -m http.server`**。
- 原因：音频 seek 依赖 HTTP Range 请求（`Accept-Ranges: bytes` / `206 Partial Content`）。Python 内置服务器不支持 Range 请求，会导致 Chrome 无法拖动进度条；`npx serve` 原生支持。

## 完成标准

- 本地改动范围清楚。
- 关键静态数据格式通过校验。
- 播放相关改动至少检查 `app.js` 语法。
- 如未明确要求部署，最终回复说明“未提交、未推送、未部署”。
