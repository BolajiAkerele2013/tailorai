# 👕 TailorAI

**TailorAI** is a web-based body measurement tool that uses **real-time AI pose estimation** via MediaPipe to analyze a user’s body shape and extract physical measurements. Ideal for fashion tech, virtual tailoring, or custom-fit ecommerce, the app is built with React and serverless Netlify Functions.

---

## 📸 Features

- Live camera feed for full-body scanning
- AI-powered pose detection using **MediaPipe Pose**
- Automatic landmark tracking (shoulders, hips, etc.)
- Multiple measurement steps (e.g., front, side views)
- Snapshots and pose data export per step
- Device camera switching (front/rear)

---

## 🧠 How It Works

1. User grants access to their camera.
2. App streams frames into **MediaPipe Pose**, which detects 33 anatomical landmarks.
3. Landmarks are stored and can be used to calculate body segment measurements.
4. (Planned) AI logic converts landmark data into dimension estimates like chest, waist, and hip size.

---

## 🚀 Tech Stack

| Layer       | Tech                    |
|-------------|-------------------------|
| Frontend    | React + Vite            |
| Backend     | Netlify Functions       |
| AI Core     | MediaPipe Pose (JS)     |
| Styling     | Tailwind CSS (planned)  |

---

## 🧪 Local Development

### Clone & Install

```bash
git clone https://github.com/BolajiAkerele2013/tailorai
cd tailorai
npm install
