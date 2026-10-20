# Dahan-Dahan Calculator

A browser-based calculator with synchronized lyrics and MP3 playback. It is a static site, so GitHub Pages can host it without a server or build step. The Java Swing version remains in `calculetime.java` for desktop use.

## Run locally

Open `index.html` in a browser, or serve the folder locally:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Push the repository contents to GitHub, including `index.html`, `app.js`, `styles.css`, `lyrics.txt`, and `song/dahan.mp3`.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select your branch and the `/ (root)` folder, then save.
4. Open the site URL shown on the Pages settings screen. It will look like `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

The MP3 is a separate file, so make sure it is included in the commit and pushed to GitHub. Audio starts when you press `=` or **Play lyrics + song**. Browser playback uses the built-in audio player and does not require FFmpeg.

## Lyrics and timing

Edit `lyrics.txt`, one lyric per line. Lines starting with `#` are ignored. To customize the display duration, add milliseconds and a bar before a line, for example `5200|your lyric here`. Untimed lines display for four seconds.

The calculator also supports keyboard input: number keys, `+`, `-`, `*`, `/`, `%`, decimal point, Enter, Backspace, and Escape.
