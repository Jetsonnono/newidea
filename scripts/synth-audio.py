#!/usr/bin/env python3
"""Original score for episode 01. Locked to the scene cuts in timeline.json."""

import json
import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TIMELINE = json.loads((ROOT / "episodes" / "01" / "timeline.json").read_text())
OUT = ROOT / "episodes" / "01" / "dist" / "score.wav"
LOUDNESS = ROOT / "episodes" / "01" / "dist" / "loudness.json"

SR = 48000
DUR = float(TIMELINE["duration"])
BPM = 100
BEAT = 60.0 / BPM
N = int(round(DUR * SR))
CUTS = [scene["start"] for scene in TIMELINE["scenes"]]

# A dorian cells written for this film. Not a quotation.
CELLS = [
    [0, 7, 5, 3, 10, 0, 3, 5],
    [3, 10, 7, 5, 0, 3, 5, 7],
]
DEGREE = {
    0: 220.00,   # A3
    3: 261.63,   # C4
    5: 293.66,   # D4
    7: 329.63,   # E4
    10: 392.00,  # G4
}


def add(buf, i, value):
    if 0 <= i < len(buf):
        buf[i] += value


def pluck(buf, t, freq, amp, decay=0.17):
    start = int(t * SR)
    length = int(decay * 5 * SR)
    for i in range(length):
        env = math.exp(-i / (decay * SR))
        add(buf, start + i, amp * env * math.sin(2 * math.pi * freq * i / SR))


def bass(buf, t, freq, amp=0.22):
    start = int(t * SR)
    length = int(0.42 * SR)
    for i in range(length):
        env = math.exp(-i / (0.16 * SR))
        add(buf, start + i, amp * env * math.sin(2 * math.pi * freq * i / SR))


def kick(buf, t, amp=0.7):
    start = int(t * SR)
    length = int(0.16 * SR)
    for i in range(length):
        p = i / length
        freq = 150 - 105 * p
        env = math.exp(-i / (0.045 * SR))
        add(buf, start + i, amp * env * math.sin(2 * math.pi * freq * i / SR))
        if i < int(0.004 * SR):
            add(buf, start + i, amp * 0.35 * (1 - i / (0.004 * SR)))


def hat(buf, t, amp=0.045):
    start = int(t * SR)
    length = int(0.04 * SR)
    seed = int(t * 1000) + 17
    for i in range(length):
        seed = (1103515245 * seed + 12345) & 0x7FFFFFFF
        noise = ((seed / 0x7FFFFFFF) * 2 - 1)
        env = math.exp(-i / (0.012 * SR))
        add(buf, start + i, amp * env * noise)


def rise(buf, t, amp=0.12):
    """Short noise swell that lands on a cut."""
    length = int(0.28 * SR)
    start = int(t * SR) - length
    seed = 99 + int(t * 10)
    for i in range(length):
        seed = (1103515245 * seed + 12345) & 0x7FFFFFFF
        noise = ((seed / 0x7FFFFFFF) * 2 - 1)
        p = i / length
        env = p * p * (1 - p)
        # crude one-pole brightening
        add(buf, start + i, amp * env * noise)


def render():
    buf = [0.0] * N
    step = BEAT / 2
    t = 0.0
    eighth = 0
    while t < DUR - 0.02:
        bar = eighth // 16
        cell = CELLS[0 if bar < 10 else 1]
        degree = cell[eighth % 8]
        octave = 2 if eighth % 8 in (0, 4) else 1
        if eighth % 2 == 0:
            pluck(buf, t, DEGREE[degree] * octave, 0.16)
        if eighth % 8 == 0:
            root = 110.0 if bar < 10 or bar >= 14 else 87.31  # A2, then D2, then A2
            bass(buf, t, root, 0.2)
            kick(buf, t, 0.62)
        elif eighth % 8 == 4:
            kick(buf, t, 0.28)
        if eighth % 4 == 2:
            hat(buf, t, 0.04)
        t += step
        eighth += 1

    for cut in CUTS:
        if cut <= 0:
            continue
        rise(buf, cut, 0.1)
        kick(buf, cut, 0.85)

    # Sustained fifth so the bed stays present between hits.
    for i in range(N):
        t = i / SR
        trem = 0.82 + 0.18 * math.sin(2 * math.pi * 0.08 * t)
        if 24.0 <= t < 33.6:
            root, fifth = 87.31, 130.81
        else:
            root, fifth = 110.0, 164.81
        buf[i] += 0.075 * trem * (
            math.sin(2 * math.pi * root * t) + 0.55 * math.sin(2 * math.pi * fifth * t)
        )

    fade_in = int(0.12 * SR)
    fade_out = int(1.3 * SR)
    peak = 1e-9
    for i, sample in enumerate(buf):
        gain = 1.0
        if i < fade_in:
            gain *= i / fade_in
        if i > N - fade_out:
            gain *= max(0.0, (N - i) / fade_out)
        shaped = math.tanh(sample * gain * 1.35)
        buf[i] = shaped
        peak = max(peak, abs(shaped))

    target = 10 ** (-1.5 / 20)  # -1.5 dBFS peak
    scale = target / peak
    pcm = bytearray()
    scaled = []
    for sample in buf:
        value = sample * scale
        scaled.append(value)
        pcm += struct.pack("<h", max(-32767, min(32767, int(value * 32767))))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT), "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(pcm)

    window = SR
    per_second = []
    for sec in range(int(DUR)):
        chunk = scaled[sec * window : (sec + 1) * window]
        rms = math.sqrt(sum(v * v for v in chunk) / len(chunk))
        db = 20 * math.log10(rms) if rms > 1e-9 else -120
        per_second.append(round(db, 2))
    LOUDNESS.write_text(json.dumps({
        "bpm": BPM,
        "duration": DUR,
        "peakDbfs": round(20 * math.log10(target), 2),
        "cuts": CUTS,
        "rmsDbfsPerSecond": per_second,
    }, ensure_ascii=False, indent=2))
    print("wrote", OUT)
    print("peak target", round(20 * math.log10(target), 2), "dBFS")


if __name__ == "__main__":
    render()
