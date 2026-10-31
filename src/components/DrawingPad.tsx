import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, RotateCcw, Play, Sparkles, Maximize2, Minimize2, Undo2, Redo2 } from 'lucide-react';

interface DrawingPadProps {
  onAnalyze: (base64: string) => void;
  loading: boolean;
  clearTrigger: number;
}

interface Stroke {
  points: { x: number, y: number }[];
}

export const DrawingPad: React.FC<DrawingPadProps> = ({ onAnalyze, loading, clearTrigger }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // History state for Undo/Redo
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);

  // Function to redraw everything based on history
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw all confirmed strokes
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8';

    strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current active stroke
    if (currentStroke && currentStroke.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
      for (let i = 1; i < currentStroke.points.length; i++) {
        ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  // Initial render & clear trigger
  useEffect(() => {
    setStrokes([]);
    setRedoStack([]);
    setCurrentStroke(null);
  }, [clearTrigger]);

  // Re-render whenever history changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const clearCanvas = () => {
    setStrokes([]);
    setRedoStack([]);
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = [...strokes];
    const lastStroke = newStrokes.pop();
    if (lastStroke) {
      setStrokes(newStrokes);
      setRedoStack(prev => [...prev, lastStroke]);
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const newRedo = [...redoStack];
    const strokeToRestore = newRedo.pop();
    if (strokeToRestore) {
      setRedoStack(newRedo);
      setStrokes(prev => [...prev, strokeToRestore]);
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Exact mapping for CSS scaled canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getCoordinates(e);
    setCurrentStroke({ points: [pos] });
    setRedoStack([]); // Clear redo stack on new action
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const pos = getCoordinates(e);
    setCurrentStroke(prev => prev ? { points: [...prev.points, pos] } : null);
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
  };

  const wrapperStyle: React.CSSProperties = isFullscreen 
    ? { position: 'fixed', inset: 0, zIndex: 50, background: '#020617', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }
    : { display: 'flex', flexDirection: 'column', gap: '12px' };

  return (
    <div style={wrapperStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Pencil size={18} /> Sketch Board
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Undo/Redo Buttons */}
          <div style={{ display: 'flex', background: '#1e293b', borderRadius: '6px', border: '1px solid #334155', overflow: 'hidden', marginRight: '8px' }}>
            <button 
              onClick={handleUndo} 
              disabled={strokes.length === 0}
              style={{ background: 'transparent', border: 'none', borderRight: '1px solid #334155', color: strokes.length === 0 ? '#475569' : '#fff', padding: '6px 10px', cursor: strokes.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button 
              onClick={handleRedo} 
              disabled={redoStack.length === 0}
              style={{ background: 'transparent', border: 'none', color: redoStack.length === 0 ? '#475569' : '#fff', padding: '6px 10px', cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Redo"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <button onClick={() => setIsFullscreen(!isFullscreen)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />} 
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button onClick={clearCanvas} style={{ background: '#334155', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RotateCcw size={14} /> Clear
          </button>
        </div>
      </div>

      <div style={{ border: '2px solid #334155', borderRadius: '12px', overflow: 'hidden', flex: isFullscreen ? 1 : 'none', background: '#0f172a', touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          style={{ display: 'block', cursor: 'crosshair', width: '100%', height: '100%' }}
        />
      </div>

      <button
        onClick={() => onAnalyze(canvasRef.current?.toDataURL('image/png') || '')}
        disabled={loading}
        style={{
          background: loading ? '#475569' : 'linear-gradient(135deg, #0284c7, #2563eb)',
          border: 'none',
          color: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '16px'
        }}
      >
        {loading ? <Sparkles className="animate-spin" size={18} /> : <Play size={18} />}
        {loading ? 'Gemma 4 Reasoning...' : (isFullscreen ? 'Run Gemma Simulation & Exit' : 'Run Gemma 4 Simulation')}
      </button>
    </div>
  );
};
