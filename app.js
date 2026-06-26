const SONG_CATALOG_URL = "assets/songs.json";

let songs = [];
let currentSongIndex = -1;
let lyrics = [];
let activeLineIndex = -1;
let isSeeking = false;

const page = document.body.dataset.page;

async function fetchSongs() {
  const response = await fetch(SONG_CATALOG_URL);
  if (!response.ok) {
    throw new Error("Unable to load song catalog.");
  }
  return response.json();
}

function getSongUrl(songId) {
  return `player.html?id=${encodeURIComponent(songId)}`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function parseLrc(text) {
  return text
    .split(/\r?\n/)
    .flatMap((line) => {
      const matches = [...line.matchAll(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
      const content = line.replace(/\[[^\]]+\]/g, "").trim();
      if (!matches.length || !content) return [];

      return matches.map((match) => ({
        time: Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] || "0"}`),
        text: content
      }));
    })
    .sort((a, b) => a.time - b.time);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderListPage() {
  const songList = document.querySelector("#songList");
  const listState = document.querySelector("#listState");

  fetchSongs()
    .then((loadedSongs) => {
      songs = loadedSongs;
      songList.innerHTML = "";

      if (!songs.length) {
        listState.textContent = "还没有歌曲。请在 assets/songs.json 添加歌曲。";
        listState.hidden = false;
        return;
      }

      listState.hidden = true;
      songs.forEach((song) => {
        const link = document.createElement("a");
        link.className = "song-card";
        link.href = getSongUrl(song.id);
        link.innerHTML = `
          <span class="song-card-title"></span>
          <span class="song-card-artist"></span>
          <span class="song-card-meta"></span>
        `;
        link.querySelector(".song-card-title").textContent = song.title;
        link.querySelector(".song-card-artist").textContent = song.artist || "未知歌手";
        link.querySelector(".song-card-meta").textContent = song.audio.split("/").at(-1);
        songList.append(link);
      });
    })
    .catch(() => {
      songList.innerHTML = "";
      listState.textContent = "歌曲数据读取失败，请检查 assets/songs.json。";
      listState.hidden = false;
    });
}

function getPlayerElements() {
  return {
    audioPlayer: document.querySelector("#audioPlayer"),
    songTitle: document.querySelector("#songTitle"),
    songArtist: document.querySelector("#songArtist"),
    miniSongTitle: document.querySelector("#miniSongTitle"),
    miniSongArtist: document.querySelector("#miniSongArtist"),
    songSelect: document.querySelector("#songSelect"),
    lyricsList: document.querySelector("#lyricsList"),
    currentTime: document.querySelector("#currentTime"),
    duration: document.querySelector("#duration"),
    seekBar: document.querySelector("#seekBar"),
    previousButton: document.querySelector("#previousButton"),
    rewindButton: document.querySelector("#rewindButton"),
    playPauseButton: document.querySelector("#playPauseButton"),
    forwardButton: document.querySelector("#forwardButton"),
    nextButton: document.querySelector("#nextButton"),
    repeatLineButton: document.querySelector("#repeatLineButton")
  };
}

function renderSongOptions(songSelect) {
  songSelect.innerHTML = "";
  songs.forEach((song) => {
    const option = document.createElement("option");
    option.value = song.id;
    option.textContent = `${song.title} - ${song.artist || "未知歌手"}`;
    songSelect.append(option);
  });
}

function renderLyrics(lyricsList) {
  lyricsList.innerHTML = "";

  if (!lyrics.length) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "没有可显示的歌词。";
    lyricsList.append(item);
    return;
  }

  lyrics.forEach((line, index) => {
    const item = document.createElement("li");
    item.className = "lyric-line";
    item.dataset.index = String(index);
    item.textContent = line.text;
    item.addEventListener("click", () => {
      const { audioPlayer } = getPlayerElements();
      audioPlayer.currentTime = line.time;
      audioPlayer.play();
    });
    lyricsList.append(item);
  });
}

function renderLyricsError(lyricsList, message) {
  lyrics = [];
  activeLineIndex = -1;
  lyricsList.innerHTML = "";
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = message;
  lyricsList.append(item);
}

async function loadSong(songId, shouldPlay = false) {
  const elements = getPlayerElements();
  const nextIndex = songs.findIndex((song) => song.id === songId);
  if (nextIndex === -1) {
    renderLyricsError(elements.lyricsList, "没有找到这首歌。");
    setText("#songTitle", "歌曲不存在");
    setText("#songArtist", "请返回列表重新选择");
    return;
  }

  currentSongIndex = nextIndex;
  const song = songs[currentSongIndex];
  elements.songTitle.textContent = song.title;
  elements.songArtist.textContent = song.artist || "未知歌手";
  elements.miniSongTitle.textContent = song.title;
  elements.miniSongArtist.textContent = song.artist || "未知歌手";
  elements.songSelect.value = song.id;
  elements.audioPlayer.src = song.audio;
  elements.seekBar.value = "0";
  elements.seekBar.max = "0";
  elements.currentTime.textContent = "0:00";
  elements.duration.textContent = "0:00";
  elements.playPauseButton.textContent = "▶";
  elements.playPauseButton.setAttribute("aria-label", "播放");
  elements.playPauseButton.setAttribute("title", "播放");
  activeLineIndex = -1;

  const nextUrl = getSongUrl(song.id);
  if (window.location.pathname.endsWith("player.html")) {
    window.history.replaceState({}, "", nextUrl);
  }

  try {
    const response = await fetch(song.lyrics);
    if (!response.ok) throw new Error("Unable to load lyrics.");
    lyrics = parseLrc(await response.text());
    renderLyrics(elements.lyricsList);
  } catch (error) {
    renderLyricsError(elements.lyricsList, "歌词加载失败，请检查 LRC 文件路径。");
  }

  if (shouldPlay) {
    await elements.audioPlayer.play();
  }
}

function syncActiveLine() {
  const { audioPlayer, lyricsList } = getPlayerElements();
  if (!lyrics.length) return;

  const current = audioPlayer.currentTime;
  const nextIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return current >= line.time && (!nextLine || current < nextLine.time);
  });

  if (nextIndex === -1 || nextIndex === activeLineIndex) return;

  lyricsList.querySelector(".is-active")?.classList.remove("is-active");
  const activeElement = lyricsList.querySelector(`[data-index="${nextIndex}"]`);
  activeElement?.classList.add("is-active");
  activeElement?.scrollIntoView({ block: "center", behavior: "smooth" });
  activeLineIndex = nextIndex;
}

function seekBy(seconds) {
  const { audioPlayer } = getPlayerElements();
  audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.duration || 0, audioPlayer.currentTime + seconds));
}

function repeatActiveLine() {
  const { audioPlayer } = getPlayerElements();
  if (activeLineIndex >= 0 && lyrics[activeLineIndex]) {
    audioPlayer.currentTime = lyrics[activeLineIndex].time;
    audioPlayer.play();
  }
}

function loadAdjacentSong(offset) {
  if (!songs.length || currentSongIndex === -1) return;
  const nextIndex = (currentSongIndex + offset + songs.length) % songs.length;
  loadSong(songs[nextIndex].id, true);
}

function bindPlayerEvents() {
  const elements = getPlayerElements();

  elements.audioPlayer.addEventListener("loadedmetadata", () => {
    elements.seekBar.max = String(elements.audioPlayer.duration || 0);
    elements.duration.textContent = formatTime(elements.audioPlayer.duration);
  });

  elements.audioPlayer.addEventListener("timeupdate", () => {
    if (!isSeeking) {
      elements.seekBar.value = String(elements.audioPlayer.currentTime);
    }
    elements.currentTime.textContent = formatTime(elements.audioPlayer.currentTime);
    syncActiveLine();
  });

  elements.audioPlayer.addEventListener("play", () => {
    elements.playPauseButton.textContent = "⏸";
    elements.playPauseButton.setAttribute("aria-label", "暂停");
    elements.playPauseButton.setAttribute("title", "暂停");
  });

  elements.audioPlayer.addEventListener("pause", () => {
    elements.playPauseButton.textContent = "▶";
    elements.playPauseButton.setAttribute("aria-label", "播放");
    elements.playPauseButton.setAttribute("title", "播放");
  });

  elements.audioPlayer.addEventListener("ended", () => loadAdjacentSong(1));

  elements.seekBar.addEventListener("input", () => {
    isSeeking = true;
    elements.currentTime.textContent = formatTime(Number(elements.seekBar.value));
  });

  elements.seekBar.addEventListener("change", () => {
    elements.audioPlayer.currentTime = Number(elements.seekBar.value);
    isSeeking = false;
  });

  elements.playPauseButton.addEventListener("click", () => {
    if (elements.audioPlayer.paused) {
      elements.audioPlayer.play();
    } else {
      elements.audioPlayer.pause();
    }
  });

  elements.previousButton.addEventListener("click", () => loadAdjacentSong(-1));
  elements.nextButton.addEventListener("click", () => loadAdjacentSong(1));
  elements.rewindButton.addEventListener("click", () => seekBy(-5));
  elements.forwardButton.addEventListener("click", () => seekBy(5));
  elements.repeatLineButton.addEventListener("click", repeatActiveLine);
  elements.songSelect.addEventListener("change", (event) => loadSong(event.target.value, true));
}

async function renderPlayerPage() {
  const elements = getPlayerElements();

  try {
    songs = await fetchSongs();
    renderSongOptions(elements.songSelect);

    if (!songs.length) {
      renderLyricsError(elements.lyricsList, "还没有歌曲。请在 assets/songs.json 添加歌曲。");
      setText("#songTitle", "没有歌曲");
      return;
    }

    bindPlayerEvents();
    const params = new URLSearchParams(window.location.search);
    const requestedSongId = params.get("id") || songs[0].id;
    await loadSong(requestedSongId);
  } catch (error) {
    renderLyricsError(elements.lyricsList, "歌曲数据读取失败，请检查 assets/songs.json。");
    setText("#songTitle", "加载失败");
    setText("#songArtist", "请检查静态数据文件");
  }
}

if (page === "list") {
  renderListPage();
}

if (page === "player") {
  renderPlayerPage();
}
