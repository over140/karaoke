# Karaoke Practice

生成日期：2026-06-26  
信息来源：用户说明“练习唱歌的网页，后面部署到 GitHub，音频和歌词都做静态”  
待确认项：歌曲列表、音频格式、歌词版权与发布范围、是否需要录音/评分功能

这是一个纯静态的唱歌练习网页原型，可直接放到 GitHub Pages 部署。当前不需要构建工具、服务器或数据库。

## 目录结构

```text
index.html          # 歌曲列表页
player.html         # 歌曲播放页
styles.css          # 页面样式
app.js              # 播放器和歌词同步逻辑
assets/songs.json   # 歌曲清单
assets/audio/       # 音频文件，建议使用 .mp3 或 .m4a
assets/lyrics/      # LRC 歌词文件
```

## 添加歌曲

1. 把音频放到 `assets/audio/`。
2. 把同名或对应的 LRC 歌词放到 `assets/lyrics/`。
3. 在 `assets/songs.json` 增加一条记录：

```json
{
  "id": "song-id",
  "title": "Song Title",
  "artist": "Artist",
  "audio": "assets/audio/song-id.mp3",
  "lyrics": "assets/lyrics/song-id.lrc"
}
```

## LRC 格式

```text
[00:01.20]第一句歌词
[00:05.80]第二句歌词
```

## 本地预览

直接打开 `index.html` 可以查看页面。若浏览器拦截本地 `fetch`，可在本目录运行：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 发布注意

- 如果仓库用于 GitHub Pages，音频和歌词会成为公开静态资源。
- 发布真实歌曲前需要确认音频和歌词的授权。
- 不建议把私人录音或未脱敏资料放入公开仓库。
