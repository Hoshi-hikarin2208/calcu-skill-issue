import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import javax.swing.border.EmptyBorder;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

public class calculetime extends JFrame {

    private JTextField display;

    private double firstNumber = 0;
    private String operator = "";
    private boolean newNumber = true;

    // ---- Lyric timing settings ----
    private static final int DEFAULT_LINE_MS = 4000;   // total time per line
    private static final double TYPING_PORTION = 0.6;  // 60% typing, 40% hold
    private static final int START_DELAY_MS = 1500;    // show the answer first

    private final List<String> lyrics = new ArrayList<>();
    private javax.swing.Timer lyricTimer;
    private Process audioProcess;

    private final Color BACKGROUND = new Color(18, 18, 20);
    private final Color DISPLAY_BG = new Color(25, 25, 28);
    private final Color NUMBER_BUTTON = new Color(45, 45, 48);
    private final Color OPERATOR_BUTTON = new Color(255, 149, 0);
    private final Color CLEAR_BUTTON = new Color(100, 100, 105);
    private final Color EQUAL_BUTTON = new Color(50, 170, 110);

    public calculetime() {
        setTitle("Dahan-Dahan Calculator");
        setSize(380, 650);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setResizable(false);
        getContentPane().setBackground(BACKGROUND);
        setLayout(new BorderLayout());

        JPanel displayPanel = new JPanel(new BorderLayout());
        displayPanel.setBackground(BACKGROUND);
        displayPanel.setBorder(new EmptyBorder(25, 20, 15, 20));

        display = new JTextField("0");
        display.setFont(new Font("Arial", Font.BOLD, 34));
        display.setHorizontalAlignment(JTextField.RIGHT);
        display.setEditable(false);
        display.setBackground(DISPLAY_BG);
        display.setForeground(Color.WHITE);
        display.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(55, 55, 60), 1),
            new EmptyBorder(20, 15, 20, 15)));
        displayPanel.add(display, BorderLayout.CENTER);
        add(displayPanel, BorderLayout.NORTH);

        JPanel panel = new JPanel(new GridLayout(5, 4, 10, 10));
        panel.setBackground(BACKGROUND);
        panel.setBorder(new EmptyBorder(10, 20, 20, 20));

        String[] buttons = {
            "C", "÷", "×", "−",
            "7", "8", "9", "+",
            "4", "5", "6", "=",
            "1", "2", "3", ".",
            "0", "±", "%", "⌫"
        };

        for (String text : buttons) {
            JButton button = createButton(text);
            button.addActionListener(e -> buttonPressed(text));
            panel.add(button);
        }
        add(panel, BorderLayout.CENTER);

        loadLyrics();
    }

    /** Looks for lyrics.txt in the working folder, then next to the jar. */
    private void loadLyrics() {
        List<File> candidates = new ArrayList<>();
        candidates.add(new File("lyrics.txt"));
        try {
            File jar = new File(calculetime.class.getProtectionDomain()
                .getCodeSource().getLocation().toURI());
            File dir = jar.isDirectory() ? jar : jar.getParentFile();
            candidates.add(new File(dir, "lyrics.txt"));
        } catch (Exception ignored) { }

        for (File f : candidates) {
            if (f.isFile()) {
                try {
                    for (String line : Files.readAllLines(f.toPath(), StandardCharsets.UTF_8)) {
                        String t = line.trim();
                        if (!t.isEmpty() && !t.startsWith("#")) lyrics.add(t);
                    }
                    return;
                } catch (Exception ignored) { }
            }
        }
    }

    private Color baseColor(String text) {
        if (text.equals("C")) return CLEAR_BUTTON;
        if (text.equals("+") || text.equals("−") || text.equals("×") || text.equals("÷"))
            return OPERATOR_BUTTON;
        if (text.equals("=")) return EQUAL_BUTTON;
        return NUMBER_BUTTON;
    }

    private JButton createButton(String text) {
        JButton button = new JButton(text);
        button.setFont(new Font("Arial", Font.BOLD, 21));
        button.setFocusPainted(false);
        button.setBorderPainted(false);
        button.setOpaque(true);
        button.setForeground(Color.WHITE);
        button.setBackground(baseColor(text));

        button.addMouseListener(new MouseAdapter() {
            @Override public void mouseEntered(MouseEvent e) {
                button.setBackground(baseColor(text).brighter());
            }
            @Override public void mouseExited(MouseEvent e) {
                button.setBackground(baseColor(text));
            }
        });
        return button;
    }

    private String format(double v) {
        if (v == (long) v && Math.abs(v) < 1e15) return String.valueOf((long) v);
        String s = String.valueOf(v);
        return s;
    }

    private void buttonPressed(String button) {
        stopLyrics();

        if (button.matches("[0-9]")) {
            if (newNumber || display.getText().equals("0")) {
                display.setText(button);
                newNumber = false;
            } else {
                display.setText(display.getText() + button);
            }
            return;
        }

        if (button.equals(".")) {
            if (newNumber) {
                display.setText("0.");
                newNumber = false;
            } else if (!display.getText().contains(".")) {
                display.setText(display.getText() + ".");
            }
            return;
        }

        if (button.equals("C")) {
            display.setText("0");
            firstNumber = 0;
            operator = "";
            newNumber = true;
            return;
        }

        if (button.equals("⌫")) {
            String current = display.getText();
            if (newNumber || current.length() <= 1
                || (current.length() == 2 && current.startsWith("-"))) {
                display.setText("0");
                newNumber = true;
            } else {
                display.setText(current.substring(0, current.length() - 1));
            }
            return;
        }

        if (button.equals("±")) {
            try {
                double v = Double.parseDouble(display.getText());
                if (v != 0) display.setText(format(-v));
            } catch (NumberFormatException e) {
                display.setText("0");
                newNumber = true;
            }
            return;
        }

        if (button.equals("%")) {
            try {
                double v = Double.parseDouble(display.getText());
                display.setText(format(v / 100.0));
                newNumber = true;
            } catch (NumberFormatException e) {
                display.setText("0");
                newNumber = true;
            }
            return;
        }

        if (button.equals("+") || button.equals("−")
            || button.equals("×") || button.equals("÷")) {
            try {
                firstNumber = Double.parseDouble(display.getText());
                operator = button;
                newNumber = true;
            } catch (NumberFormatException e) {
                display.setText("Error");
                newNumber = true;
            }
            return;
        }

        if (button.equals("=")) {
            if (operator.isEmpty()) return;
            try {
                double secondNumber = Double.parseDouble(display.getText());
                double result = 0;

                switch (operator) {
                    case "+": result = firstNumber + secondNumber; break;
                    case "−": result = firstNumber - secondNumber; break;
                    case "×": result = firstNumber * secondNumber; break;
                    case "÷":
                        if (secondNumber == 0) {
                            display.setText("Cannot divide by 0");
                            operator = "";
                            newNumber = true;
                            return;
                        }
                        result = firstNumber / secondNumber;
                        break;
                }

                operator = "";
                showLyrics(result);

            } catch (NumberFormatException e) {
                display.setText("Error");
                operator = "";
                newNumber = true;
            }
        }
    }

    /**
     * Shows the result, then (after a short delay) types each lyric line.
     * Every line gets a fixed total duration, so timing doesn't depend on
     * line length. A line in lyrics.txt may start with "milliseconds|" to set
     * its own duration, e.g.  5200|my line here
     */
    private void showLyrics(double result) {
        stopLyrics();
        display.setText(format(result));
        newNumber = true;
        if (lyrics.isEmpty()) return;

        final int[] idx = {0};
        final long[] start = {0};

        lyricTimer = new javax.swing.Timer(30, null);
        lyricTimer.setInitialDelay(START_DELAY_MS);
        lyricTimer.addActionListener(e -> {
            if (start[0] == 0) {
                start[0] = System.currentTimeMillis();
                startSong();
            }
            if (idx[0] >= lyrics.size()) {
                stopLyrics();
                return;
            }

            String raw = lyrics.get(idx[0]);
            int dur = DEFAULT_LINE_MS;
            String text = raw;
            int bar = raw.indexOf('|');
            if (bar > 0) {
                try {
                    dur = Integer.parseInt(raw.substring(0, bar).trim());
                    text = raw.substring(bar + 1);
                } catch (NumberFormatException ignored) { }
            }

            long elapsed = System.currentTimeMillis() - start[0];
            int typeMs = Math.max(1, (int) (dur * TYPING_PORTION));
            int chars = elapsed >= typeMs
                ? text.length()
                : (int) (text.length() * elapsed / (double) typeMs);
            display.setText(text.substring(0, Math.min(chars, text.length())));

            if (elapsed >= dur) {
                idx[0]++;
                start[0] = System.currentTimeMillis();
            }
        });
        lyricTimer.start();
    }

    private void startSong() {
        List<File> candidates = new ArrayList<>();
        candidates.add(new File("song/dahan.mp3"));
        candidates.add(new File("song/song.mp3"));
        try {
            File jar = new File(calculetime.class.getProtectionDomain()
                .getCodeSource().getLocation().toURI());
            File dir = jar.isDirectory() ? jar : jar.getParentFile();
            candidates.add(new File(dir, "song/dahan.mp3"));
            candidates.add(new File(dir, "song/song.mp3"));
        } catch (Exception ignored) { }

        File song = null;
        for (File candidate : candidates) {
            if (candidate.isFile()) {
                song = candidate;
                break;
            }
        }
        if (song == null) return;

        try {
            audioProcess = new ProcessBuilder("ffplay", "-nodisp", "-autoexit",
                "-loglevel", "error", song.getAbsolutePath())
                .redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                .start();
        } catch (IOException e) {
            System.err.println("Could not play song/song.mp3. Install FFmpeg (ffplay) and ensure it is on PATH.");
        }
    }

    private void stopLyrics() {
        if (lyricTimer != null && lyricTimer.isRunning()) {
            lyricTimer.stop();
            display.setText("0");
            newNumber = true;
        }
        if (audioProcess != null) {
            audioProcess.destroy();
            audioProcess = null;
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new calculetime().setVisible(true));
    }
}
