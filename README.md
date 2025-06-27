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

## Start Dev Server (w/ Netlify)
npm install -g netlify-cli
netlify dev
Visit: http://localhost:8888

🧠 ## Pose Estimation Logic
TailorAI uses MediaPipe’s 33-point Pose model to capture:
 - poseLandmarks (2D screen coordinates)
 - poseWorldLandmarks (3D estimation)
 - segmentationMask (optional silhouette)

These are continuously updated as the video plays. When the user clicks “Capture,” the app stores both the frame and landmark data for measurement processing.

🗂 ```Project Structure

tailorai/
├── src/                      # React App
│   ├── hooks/useCamera.ts    # Camera + MediaPipe logic
│   ├── components/           # UI components
├── netlify/functions/        # Serverless endpoints
├── public/                   # Static assets
└── README.md

🔮 ```Roadmap
 Implement MediaPipe Pose in frontend

 Add logic to compute actual body measurements from landmarks

 Save/export user measurements (PDF, JSON)

 Calibrate using reference objects (e.g., credit card, paper)

 Add Tailwind CSS for design improvements

🔐 Privacy
No images or personal data are stored remotely.
All pose analysis occurs client-side using in-browser AI models.

🤝 Contributing
 - Fork this repo
 - Create a new branch: feature/my-feature
 - Submit a pull request

📄 License
MIT License
---

