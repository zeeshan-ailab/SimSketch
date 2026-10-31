import React, { useState, useEffect, useRef } from 'react';
import { OpticsParams, OpticalElement } from '../types/physics';
import { explainPhysicsConcept } from '../lib/gemma';
import { ZoomIn, ZoomOut, BrainCircuit } from 'lucide-react';

interface OpticsBenchProps { initialParams: OpticsParams; }

export const OpticsBench: React.FC<OpticsBenchProps> = ({ initialParams }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [elementType, setElementType] = useState<OpticalElement>(initialParams.element_type || 'convex_lens');
  const [focalLength, setFocalLength] = useState<number>(initialParams.focal_length || 120);
  const [doDist, setDoDist] = useState<number>(initialParams.object_distance || 220);
  const [ho, setHo] = useState<number>(initialParams.object_height || 70);
  
  const [zoom, setZoom] = useState(1);
  const [conceptText, setConceptText] = useState('');
  const [loadingExp, setLoadingExp] = useState(false);

  // Dynamic Title Generator based on element change
  const formatTitle = (type: string) => type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleExpand = async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (e.currentTarget.open && !conceptText) {
      setLoadingExp(true);
      const res = await explainPhysicsConcept(`Type: ${formatTitle(elementType)}, Focal Length: ${focalLength}, Object Dist: ${doDist}`);
      setConceptText(res);
      setLoadingExp(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midX = width / 2;
    const midY = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Apply Zoom from Center
    ctx.translate(midX, midY);
    ctx.scale(zoom, zoom);
    ctx.translate(-midX, -midY);

    // Optical Axis
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-width, midY); ctx.lineTo(width * 2, midY); ctx.stroke();

    const isMirror = elementType.includes('mirror');
    const isConvex = elementType.startsWith('convex');
    
    let effectiveF = focalLength;
    if (elementType === 'concave_lens' || elementType === 'convex_mirror') effectiveF = -focalLength;
    else if (elementType === 'plane_mirror') effectiveF = Infinity;

    // Draw Focal and Center of Curvature Points (F and 2F)
    ctx.fillStyle = '#f59e0b';
    ctx.font = '12px sans-serif';
    if (effectiveF !== Infinity) {
      const points = [
        { x: midX - effectiveF, label: 'F₁' },
        { x: midX + effectiveF, label: 'F₂' },
        { x: midX - 2 * effectiveF, label: '2F₁' },
        { x: midX + 2 * effectiveF, label: '2F₂' },
      ];
      points.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, midY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(p.label, p.x - 8, midY + 18);
      });
    }

    // Draw Element (Curved Lenses instead of straight lines)
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    if (isMirror) {
      if (elementType === 'plane_mirror') {
        ctx.moveTo(midX, midY - 120); ctx.lineTo(midX, midY + 120); ctx.stroke();
      } else if (elementType === 'concave_mirror') {
        ctx.arc(midX + 120, midY, 140, Math.PI * 0.82, Math.PI * 1.18); ctx.stroke();
      } else {
        ctx.arc(midX - 120, midY, 140, -Math.PI * 0.18, Math.PI * 0.18); ctx.stroke();
      }
    } else {
      // Curved Lenses
      if (isConvex) {
        ctx.moveTo(midX, midY - 110);
        ctx.quadraticCurveTo(midX + 30, midY, midX, midY + 110);
        ctx.quadraticCurveTo(midX - 30, midY, midX, midY - 110);
      } else { // Concave
        ctx.moveTo(midX - 15, midY - 110);
        ctx.lineTo(midX + 15, midY - 110);
        ctx.quadraticCurveTo(midX + 2, midY, midX + 15, midY + 110);
        ctx.lineTo(midX - 15, midY + 110);
        ctx.quadraticCurveTo(midX - 2, midY, midX - 15, midY - 110);
      }
      ctx.fill();
      ctx.stroke();
    }

    const objX = midX - doDist;
    const objY = midY - ho;
    drawArrow(ctx, objX, midY, objX, objY, '#22c55e', 'Object');

    let di = 0; let hi = 0; let isVirtual = false;
    if (effectiveF === Infinity) { di = -doDist; hi = ho; isVirtual = true; } 
    else {
      di = (effectiveF * doDist) / (doDist - effectiveF);
      hi = (-di / doDist) * ho;
      isVirtual = isMirror ? (di < 0) : (di < 0);
    }
    const imgX = isMirror ? midX - di : midX + di;
    const imgY = midY - hi;

    if (Math.abs(di) < 3000 && !isNaN(di)) {
      drawArrow(ctx, imgX, midY, imgX, imgY, isVirtual ? '#e11d48' : '#ec4899', isVirtual ? 'Virtual Image' : 'Real Image', isVirtual);
    }

    ctx.lineWidth = 1.5;
    // Ray 1: Parallel -> Focus
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath(); ctx.moveTo(objX, objY); ctx.lineTo(midX, objY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(midX, objY); ctx.lineTo(imgX, imgY); ctx.stroke();

    // Ray 2: Center
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath(); ctx.moveTo(objX, objY); ctx.lineTo(midX, midY); ctx.lineTo(imgX, imgY); ctx.stroke();

    // Virtual back-tracing
    if (isVirtual) {
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#f43f5e';
      ctx.beginPath(); ctx.moveTo(midX, objY); ctx.lineTo(imgX, imgY);
      ctx.moveTo(midX, midY); ctx.lineTo(imgX, imgY); ctx.stroke(); ctx.setLineDash([]);
    }

    ctx.restore();
  }, [elementType, focalLength, doDist, ho, zoom]);

  function drawArrow(ctx: CanvasRenderingContext2D, fx: number, fy: number, tx: number, ty: number, color: string, label: string, dashed = false) {
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
    if (dashed) ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
    const hl = 10; const a = Math.atan2(ty - fy, tx - fx);
    ctx.setLineDash([]); ctx.beginPath();
    ctx.moveTo(tx, ty); ctx.lineTo(tx - hl * Math.cos(a - Math.PI/6), ty - hl * Math.sin(a - Math.PI/6));
    ctx.lineTo(tx - hl * Math.cos(a + Math.PI/6), ty - hl * Math.sin(a + Math.PI/6)); ctx.fill();
    ctx.font = '12px sans-serif'; ctx.fillText(label, tx - 20, ty - 8);
    ctx.restore();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#38bdf8' }}>{formatTitle(elementType)} Simulation</h2>
      </div>

      <div style={{ border: '2px solid #334155', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '6px', zIndex: 10 }}>
          <button onClick={() => setZoom(z => z + 0.1)} style={{ background: '#1e293b', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><ZoomIn size={16} /></button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={{ background: '#1e293b', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><ZoomOut size={16} /></button>
        </div>
        <canvas ref={canvasRef} width={650} height={360} style={{ width: '100%', display: 'block' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', background: '#1e293b', padding: '14px', borderRadius: '10px' }}>
        <div>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Optical Element</label>
          <select value={elementType} onChange={(e) => setElementType(e.target.value as OpticalElement)} style={{ width: '100%', marginTop: '4px', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px', borderRadius: '6px' }}>
            <option value="convex_lens">Convex Lens</option><option value="concave_lens">Concave Lens</option>
            <option value="concave_mirror">Concave Mirror</option><option value="convex_mirror">Convex Mirror</option>
            <option value="plane_mirror">Plane Mirror</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Focal Length ($f$): {focalLength}px</label>
          <input type="range" min="60" max="220" value={focalLength} onChange={(e) => setFocalLength(Number(e.target.value))} style={{ width: '100%', marginTop: '6px' }} />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Object Distance ($d_o$): {doDist}px</label>
          <input type="range" min="80" max="400" value={doDist} onChange={(e) => setDoDist(Number(e.target.value))} style={{ width: '100%', marginTop: '6px' }} />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Object Height ($h_o$): {ho}px</label>
          <input type="range" min="30" max="110" value={ho} onChange={(e) => setHo(Number(e.target.value))} style={{ width: '100%', marginTop: '6px' }} />
        </div>
      </div>

      <details onToggle={handleExpand} style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '12px' }}>
        <summary style={{ cursor: 'pointer', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={18} /> Expand for Gemma 4 Physics Concept Analysis
        </summary>
        <div style={{ marginTop: '12px', color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6' }}>
          {loadingExp ? 'Gemma is analyzing this specific configuration...' : (conceptText || 'Click to load analysis.')}
        </div>
      </details>
    </div>
  );
};
