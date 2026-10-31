import { GoogleGenAI } from '@google/genai';
import { SimulationResult } from '../types/physics';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
let ai: any = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function analyzeSketchWithGemma(base64Image: string): Promise<SimulationResult> {
  if (!apiKey || !ai) {
    console.warn("No VITE_GEMINI_API_KEY found, fallback to preset");
    return FALLBACK_OPTICS;
  }

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `You are an expert physics simulation engine analyzer and a friendly science teacher.
Analyze this hand-drawn sketch carefully. 

First, classify it as 'optics' or 'electricity'.

=== IF ELECTRICITY ===
1. Look for a Battery (long/short lines). If the long line (+) is on the right, or it has a '-' on the left, set polarity_reversed: true.
2. Look for Zigzag lines (Resistor).
3. Look for Triangles with a line/arrows (Diode/LED). If present, set has_diode: true.
4. Look for a Circle with an 'M' or fan blades (Motor). If present, set has_motor: true.
5. Look for a gap in the wire with a hinged line (Switch). If present, set has_switch: true, and determine if it is connected (switch_closed: true) or open (switch_closed: false).
6. Infer physical values: 'voltage' (e.g., 5, 9, 12) and 'resistance' (e.g., 5 to 50).
7. EXPLANATION: Write a fun, engaging explanation for a 10-year-old student! 
   - Let the physics flow naturally. Explain Ohm's Law (Current = Voltage ÷ Resistance) simply. 
   - If there's a motor, explain how electric energy turns into spinning motion. 
   - If there's an LED, explain how it lights up (and acts as a one-way street if a diode). 
   - If there's a switch, explain how breaking the bridge stops the flow of tiny electron cars.

=== IF OPTICS ===
1. Identify lens/mirror type, focal_length (80-220), object_distance (100-350), object_height (40-100).
2. EXPLANATION: Write a fun, engaging explanation for a 10-year-old student!
   - Explain how light either bends (refraction through a lens) or bounces (reflection off a mirror).
   - Tell them why the image looks upside down or bigger/smaller based on the distances.

Return ONLY a valid JSON object matching this exact schema:
{
  "simulation_type": "optics" | "electricity",
  "title": string,
  "explanation": string,
  "optics": { "element_type": string, "focal_length": number, "object_distance": number, "object_height": number },
  "electricity": { "voltage": number, "resistance": number, "polarity_reversed": boolean, "has_diode": boolean, "has_motor": boolean, "has_switch": boolean, "switch_closed": boolean }
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemma-4-26b-a4b-it',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            { text: prompt }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingLevel: 'high' }
      }
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from Gemma response");
    
    const parsed = JSON.parse(jsonMatch[0]) as SimulationResult;
    parsed.debug_prompt = prompt;
    parsed.debug_response = text;
    
    return parsed;
  } catch (error: any) {
    console.error("Gemma generation error:", error);
    return {
      simulation_type: 'none',
      title: 'Error Parsing Sketch',
      explanation: 'Failed to parse JSON. See debug panel.',
      debug_prompt: prompt,
      debug_response: error.message || 'Unknown error'
    };
  }
}

export async function explainPhysicsConcept(configStr: string): Promise<string> {
  if (!apiKey || !ai) return "API Key missing.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemma-4-26b-a4b-it',
      contents: [{ role: 'user', parts: [{ text: `Explain the physics concept of this optical setup for a 10-year-old student in 2 concise paragraphs: ${configStr}` }]}]
    });
    return response.text || "No explanation provided.";
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

export const FALLBACK_OPTICS: SimulationResult = {
  simulation_type: 'optics',
  title: 'Biconvex Converging Lens',
  explanation: 'Imagine light is a bunch of race cars! When they drive through the curved glass lens, they bend and crash into a focal point, projecting a flipped image on the other side!',
  optics: { element_type: 'convex_lens', focal_length: 120, object_distance: 240, object_height: 70 }
};

export const FALLBACK_CIRCUIT: SimulationResult = {
  simulation_type: 'electricity',
  title: 'Ultimate DC Circuit Simulator',
  explanation: 'Think of voltage as a water pump pushing tiny electron cars through the wire! The resistor is like a bumpy road that slows them down. Ohm\'s Law says Current = Voltage ÷ Resistance.',
  electricity: { voltage: 12, resistance: 6, polarity_reversed: false, has_diode: true, has_motor: true, has_switch: true, switch_closed: true }
};
