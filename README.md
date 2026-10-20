# Dahan-Dahan Calculator

A dark-themed Java Swing calculator. After you press `=`, it shows your answer, then types out song lines one by one on the display.

## Files

| File | What it is |
|------|------------|
| `calculetime.java` | Source code |
| `calculetime.jar` | Ready-to-run app (double-click to open) |
| `lyrics.txt` | Your song lines, read when the app starts |
| `README.md` | This file |

## Requirements

Java 11 or newer (JRE or JDK).

## Run it

Keep `calculetime.jar` and `lyrics.txt` in the same folder, then either double-click the jar or run:

```
java -jar calculetime.jar
```

## Build from source

```
javac calculetime.java
printf 'Main-Class: calculetime\n' > manifest.txt
jar cfm calculetime.jar manifest.txt *.class
```

## Adding your lyrics

Open `lyrics.txt` and put one line per row. Lines starting with `#` are ignored.

To control the timing of a line, start it with the number of milliseconds and a bar:

```
5200|your line here
```

A line without a time uses the default of 4 seconds.

## Adjusting the timing

At the top of `calculetime.java`:

| Setting | Default | Meaning |
|---------|---------|---------|
| `DEFAULT_LINE_MS` | 4000 | Total time each line stays on screen |
| `TYPING_PORTION` | 0.6 | Share of that time spent typing (the rest is a pause) |
| `START_DELAY_MS` | 1500 | How long your answer shows before the lyrics begin |

Pressing any button stops the lyrics and resets the display.

## Buttons

`C` clear, `⌫` backspace, `±` change sign, `%` percent, `+ − × ÷`, `=`.

## Put it on GitHub

1. Create a repo and upload `calculetime.java`, `lyrics.txt` and `README.md`.
2. Go to **Releases → Create a new release**, attach `calculetime.jar` and `lyrics.txt`.
3. Anyone can download both files into one folder and double-click the jar.

GitHub can't run a desktop Java app from a link. For a version that opens in the browser, the calculator would need to be rewritten as a web page (GitHub Pages).
