# 🔬 SimSketch STEM: Diagram-to-Canvas Interactive Simulator

**SimSketch STEM** bridges the gap between physical classroom sketching and digital physics simulations. By leveraging the multimodal reasoning of **Gemma 4** (Google's open-weights model), this tool instantly translates hand-drawn electrical circuits and optical diagrams into live, interactive HTML5 Canvas simulations.

---

## 🏆 Hackathon Tracks Targeted
1. **Best Use of Gemma 4:** Uses Gemma 4 multimodal capabilities to extract complex physics parameters (element types, polarities, focal lengths) from messy handwriting and drawings.
2. **Best Open-Source AI Project (DigitalOcean):** Built entirely around Google's open-weights Gemma 4 model, proving that lightweight, open AI can replace complex OCR and physics-parsing pipelines.

---

## 🎯 Alignment to Problem
STEM education often suffers from a disconnect: students draw circuits and lenses on paper, but have to manually rebuild them in complex software (like PhET) to see how they work. **SimSketch solves this by letting the drawing *become* the software.** Draw a battery, a diode, and a motor—and watch the fan blades spin relative to Ohm's Law. 

---

## 🛡️ Security Features & Vulnerability Mitigations
To ensure maximum security and avoid common GenAI vulnerabilities (addressing the **Red Flags** scoring criteria):
* **Zero Hardcoded Secrets:** API keys are injected via `.env` files which are strictly `.gitignore`'d. A safe `.env.example` is provided for repository onboarding.
* **XSS & Prompt Injection Prevention:** Instead of asking the LLM to generate raw JavaScript code (which creates a massive XSS vulnerability via `eval()`), Gemma 4 is strictly constrained to output **JSON schemas**. The React frontend uses this deterministic JSON to drive a local, safe physics engine.
* **Safe Fallbacks:** If the API key is missing or the network drops, the application safely gracefully degrades to pre-loaded visual presets without crashing.

---

## 🚀 Production Readiness & Code Quality
* **Strict TypeScript Architecture:** Decoupled interfaces (`src/types/physics.ts`) ensure the LLM output strictly matches the frontend rendering engine requirements.
* **High-Performance Canvas API:** Uses `requestAnimationFrame` for 60FPS electron drift and motor rotation animations, ensuring zero UI thread blocking.
* **Gemma API Inspector:** A built-in production debug panel allows developers to see the exact prompt and raw JSON response from Gemma 4, making prompt engineering transparent and reproducible.
* **Responsive Layout:** Built with CSS/Flexbox and standard UI components to work seamlessly across displays.

---

## ⚙️ Local Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/zeeshan-ailab/SimSketch.git
   cd simsketch-stem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Secure API Key Configuration**
   Copy the example environment file and add your Gemma 4 API Key:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and insert your Gemini API Key.*

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to start sketching!

---

*Built with ❤️ in 3 hours using React, Vite, HTML5 Canvas, and Gemma 4.*
