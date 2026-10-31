import React, { useState } from 'react';
import { DrawingPad } from './components/DrawingPad';
import { OpticsBench } from './components/OpticsBench';
import { CircuitBench } from './components/CircuitBench';
import { analyzeSketchWithGemma, FALLBACK_OPTICS, FALLBACK_CIRCUIT } from './lib/gemma';
import { SimulationResult } from './types/physics';
import { Cpu, Sparkles, FilePlus2, Zap, Eye, TerminalSquare, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  const [simData, setSimData] = useState<SimulationResult>({ simulation_type: 'none', title: '', explanation: '' });
  const [loading, setLoading] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  const handleAnalyze = async (base64: string) => {
    setLoading(true);
    try {
      const result = await analyzeSketchWithGemma(base64);
      setSimData(result);
      if (result.simulation_type !== 'none') confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      
      // Auto-open debug panel if there is debug info and we just ran it
      if (result.debug_response) setShowDebug(true);
      
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleNew = () => {
    setSimData({ simulation_type: 'none', title: '', explanation: '' });
    setClearTrigger(prev => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative' }}>
      
      {/* Hidden Debug Sidebar */}
      {showDebug && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', background: '#0f172a', borderLeft: '1px solid #334155', zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}><TerminalSquare size={18}/> Gemma AI Inspector</h3>
            <button onClick={() => setShowDebug(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20}/></button>
          </div>
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
            
            <h4 style={{ color: '#f8fafc', marginTop: 0 }}>The Prompt We Sent:</h4>
            <pre style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', fontSize: '11px', color: '#94a3b8', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {simData.debug_prompt || "No prompt data. Try running a sketch first."}
            </pre>
            
            <h4 style={{ color: '#f8fafc', marginTop: '24px' }}>Gemma's Raw Thinking/Output:</h4>
            <pre style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', fontSize: '11px', color: '#a7f3d0', whiteSpace: 'pre-wrap', wordWrap: 'break-word', borderLeft: '3px solid #10b981' }}>
              {simData.debug_response || "No response data. Ensure VITE_GEMINI_API_KEY is set."}
            </pre>

          </div>
        </div>
      )}

      <header style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0284c7, #3b82f6)', padding: '8px', borderRadius: '8px' }}><Cpu size={24} color="#ffffff" /></div>
          <div><h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>SimSketch STEM</h1><p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Diagram-to-Canvas Interactive Simulator</p></div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowDebug(true)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <TerminalSquare size={14}/> Debug API
          </button>
          <span style={{ fontSize: '12px', background: '#0f172a', border: '1px solid #38bdf8', color: '#38bdf8', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}><Sparkles size={12} /> Gemma 4 Multimodal</span>
        </div>
      </header>
      
      <main style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '480px 1fr', gap: '32px' }}>
        {/* Left Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '8px' }}>
            <button onClick={handleNew} style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
              <FilePlus2 size={16} /> New
            </button>
            <button onClick={() => setSimData(FALLBACK_OPTICS)} style={{ background: '#1e293b', border: '1px solid #475569', color: '#38bdf8', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Eye size={16} /> Optics Preset
            </button>
            <button onClick={() => setSimData(FALLBACK_CIRCUIT)} style={{ background: '#1e293b', border: '1px solid #475569', color: '#fbbf24', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Zap size={16} /> Circuit Preset
            </button>
          </div>
          <DrawingPad onAnalyze={handleAnalyze} loading={loading} clearTrigger={clearTrigger} />
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {simData.simulation_type === 'none' && (
             <div style={{ height: '400px', border: '2px dashed #334155', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
               Draw a sketch and click "Run" or select a preset on the left.
             </div>
          )}
          
          {simData.simulation_type !== 'none' && (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#f59e0b' }}>{simData.title}</h2>
                <span style={{ textTransform: 'uppercase', fontSize: '11px', background: '#1e293b', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                  Mode: {simData.simulation_type}
                </span>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                {simData.explanation}
              </p>
            </div>
          )}

          {simData.simulation_type === 'optics' && simData.optics && <OpticsBench key={JSON.stringify(simData.optics)} initialParams={simData.optics} />}
          {simData.simulation_type === 'electricity' && simData.electricity && <CircuitBench key={JSON.stringify(simData.electricity)} initialParams={simData.electricity} />}
        </div>
      </main>
    </div>
  );
}
