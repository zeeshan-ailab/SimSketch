import React, { useState, useEffect, useRef } from 'react';
import { ElectricityParams } from '../types/physics';
import { RefreshCw, Power } from 'lucide-react';

interface CircuitBenchProps { initialParams: ElectricityParams; }

export const CircuitBench: React.FC<CircuitBenchProps> = ({ initialParams }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [voltage, setVoltage] = useState<number>(initialParams.voltage || 12);
  const [resistance, setResistance] = useState<number>(initialParams.resistance || 6);
  const [reversed, setReversed] = useState<boolean>(initialParams.polarity_reversed || false);
  
  const hasDiode = initialParams.has_diode || false;
  const hasMotor = initialParams.has_motor || false;
  const hasSwitch = initialParams.has_switch || false;
  
  const [switchClosed, setSwitchClosed] = useState<boolean>(initialParams.switch_closed ?? true);
  
  const particlesRef = useRef<number[]>(Array.from({ length: 48 }, (_, i) => i * 25));
  const motorAngleRef = useRef<number>(0);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pLeft = 80, pRight = 560, pTop = 70, pBottom = 270;
    const totalLen = (pRight-pLeft)*2 + (pBottom-pTop)*2;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#090d16'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const isBlockedByDiode = hasDiode && reversed;
      const isBlockedBySwitch = hasSwitch && !switchClosed;
      const isFlowing = !isBlockedByDiode && !isBlockedBySwitch;
      
      // Calculate physics automatically based on V and R
      const current = isFlowing ? (Math.abs(voltage) / resistance) : 0;
      const speed = isFlowing ? (current * 0.7) * (reversed ? -1 : 1) : 0;
      
      // Draw wires
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 14; ctx.strokeRect(pLeft, pTop, pRight - pLeft, pBottom - pTop);
      
      // If switch is open, create a gap in the inner wire
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 6; 
      ctx.beginPath();
      ctx.moveTo(pRight, pTop); ctx.lineTo(pRight, pBottom); ctx.lineTo(pLeft, pBottom); ctx.lineTo(pLeft, pTop);
      if (hasSwitch) {
        ctx.lineTo(pLeft + 60, pTop); // Leave gap for switch
        ctx.moveTo(pLeft + 120, pTop);
        ctx.lineTo(pRight, pTop);
      } else {
        ctx.lineTo(pRight, pTop);
      }
      ctx.stroke();
      
      // Battery (Top Center)
      const midTopX = (pLeft + pRight) / 2;
      ctx.fillStyle = '#090d16'; ctx.fillRect(midTopX - 45, pTop - 25, 90, 50);
      ctx.fillStyle = reversed ? '#ef4444' : '#38bdf8'; ctx.fillRect(midTopX - (reversed ? -15 : 20), pTop - 22, 6, 44);
      ctx.fillStyle = reversed ? '#38bdf8' : '#ef4444'; ctx.fillRect(midTopX + (reversed ? -20 : 15), pTop - 12, 10, 24);
      ctx.font = '14px sans-serif'; ctx.fillStyle = '#f8fafc';
      ctx.fillText(reversed ? '-  +' : '+  -', midTopX - 16, pTop - 30);
      ctx.fillText(`${voltage}V`, midTopX - 15, pTop + 40);

      // Switch (Top Left)
      if (hasSwitch) {
        ctx.fillStyle = '#090d16'; ctx.fillRect(pLeft + 55, pTop - 25, 70, 50);
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 4;
        
        // Terminals
        ctx.beginPath(); ctx.arc(pLeft + 65, pTop, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(pLeft + 115, pTop, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        
        // Lever
        ctx.beginPath(); ctx.moveTo(pLeft + 65, pTop);
        if (switchClosed) {
          ctx.lineTo(pLeft + 115, pTop); // Closed
        } else {
          ctx.lineTo(pLeft + 105, pTop - 25); // Open angled up
        }
        ctx.stroke();
        ctx.font = '12px sans-serif'; ctx.fillStyle = '#94a3b8';
        ctx.fillText("Switch", pLeft + 70, pTop - 35);
      }

      // Resistor (Bottom Left-ish)
      const resX = pLeft + 100;
      ctx.fillStyle = '#090d16'; ctx.fillRect(resX - 45, pBottom - 20, 90, 40);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4; ctx.beginPath();
      ctx.moveTo(resX - 40, pBottom);
      for (let i = -30; i <= 30; i += 15) ctx.lineTo(resX + i, pBottom + ((i / 15) % 2 === 0 ? -12 : 12));
      ctx.lineTo(resX + 40, pBottom); ctx.stroke();
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#f59e0b';
      ctx.fillText(`${resistance} Ω`, resX - 15, pBottom + 30);

      // Diode / LED (Bottom Center)
      if (hasDiode) {
        const dioX = (pLeft + pRight) / 2;
        ctx.fillStyle = '#090d16'; ctx.fillRect(dioX - 30, pBottom - 30, 60, 60);
        
        const ledOn = isFlowing;
        ctx.strokeStyle = ledOn ? '#10b981' : '#475569'; 
        ctx.fillStyle = ledOn ? 'rgba(16, 185, 129, 0.4)' : '#475569';
        ctx.lineWidth = 3;
        
        // Triangle (pointing right)
        ctx.beginPath();
        ctx.moveTo(dioX - 15, pBottom - 15); ctx.lineTo(dioX - 15, pBottom + 15); ctx.lineTo(dioX + 15, pBottom);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        
        // Blocking line
        ctx.beginPath(); ctx.moveTo(dioX + 15, pBottom - 15); ctx.lineTo(dioX + 15, pBottom + 15); ctx.stroke();

        // LED Glow arrows
        if (ledOn) {
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath(); ctx.moveTo(dioX, pBottom - 20); ctx.lineTo(dioX + 15, pBottom - 35); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(dioX + 10, pBottom - 15); ctx.lineTo(dioX + 25, pBottom - 30); ctx.stroke();
        }
      }

      // Motor (Bottom Right)
      if (hasMotor) {
        const motX = pRight - 100;
        ctx.fillStyle = '#090d16'; ctx.fillRect(motX - 40, pBottom - 40, 80, 80);
        
        // Update motor angle (spin faster if higher current/speed)
        motorAngleRef.current += speed * 0.15;
        
        ctx.save();
        ctx.translate(motX, pBottom);
        
        // Outer Casing
        ctx.strokeStyle = isFlowing ? '#a855f7' : '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI*2); ctx.stroke();
        ctx.font = '14px sans-serif'; ctx.fillStyle = isFlowing ? '#d8b4fe' : '#94a3b8';
        ctx.fillText("M", -6, 5);
        
        // Fan Blades
        ctx.rotate(motorAngleRef.current);
        ctx.fillStyle = isFlowing ? '#c084fc' : '#475569';
        for (let i=0; i<4; i++) {
          ctx.beginPath();
          ctx.ellipse(0, -15, 6, 12, 0, 0, Math.PI*2);
          ctx.fill();
          ctx.rotate(Math.PI / 2);
        }
        ctx.restore();
      }
      
      // Particles (Electrons)
      particlesRef.current = particlesRef.current.map(s => s + speed);
      ctx.fillStyle = isFlowing ? '#67e8f9' : '#475569'; // Dull if stopped
      particlesRef.current.forEach(s => {
        let d = ((s % totalLen) + totalLen) % totalLen;
        let x, y;
        if (d < (pRight-pLeft)) { x = pLeft+d; y = pTop; }
        else if ((d-=(pRight-pLeft)) < (pBottom-pTop)) { x = pRight; y = pTop+d; }
        else if ((d-=(pBottom-pTop)) < (pRight-pLeft)) { x = pRight-d; y = pBottom; }
        else { x = pLeft; y = pBottom-(d-(pRight-pLeft)); }
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI*2); ctx.fill();
      });
      
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [voltage, resistance, reversed, hasDiode, hasMotor, hasSwitch, switchClosed]);

  // Determine current for display
  const isBlockedByDiode = hasDiode && reversed;
  const isBlockedBySwitch = hasSwitch && !switchClosed;
  const isFlowing = !isBlockedByDiode && !isBlockedBySwitch;
  const currentVal = isFlowing ? (voltage/resistance).toFixed(2) : "0.00";
  
  let statusText = 'FLOWING';
  let statusColor = '#10b981';
  if (isBlockedBySwitch) { statusText = 'SWITCH OPEN'; statusColor = '#f59e0b'; }
  else if (isBlockedByDiode) { statusText = 'BLOCKED BY DIODE'; statusColor = '#ef4444'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ border: '2px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={650} height={360} style={{ width: '100%', display: 'block' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #1e293b' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '11px', color: '#94a3b8' }}>CURRENT ($I = V/R$)</div><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{currentVal} A</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '11px', color: '#94a3b8' }}>STATUS</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: statusColor, marginTop: '4px' }}>{statusText}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '10px', background: '#1e293b', padding: '14px', borderRadius: '10px', alignItems: 'center' }}>
        <div><label style={{ fontSize: '13px', color: '#94a3b8' }}>Voltage: {voltage} V</label><input type="range" min="2" max="36" value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} style={{ width: '100%', marginTop: '6px' }} /></div>
        <div><label style={{ fontSize: '13px', color: '#94a3b8' }}>Resistance: {resistance} Ω</label><input type="range" min="1" max="40" value={resistance} onChange={(e) => setResistance(Number(e.target.value))} style={{ width: '100%', marginTop: '6px' }} /></div>
        <button onClick={() => setReversed(p => !p)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', height: '42px', marginTop: '16px' }}><RefreshCw size={16} /></button>
        {hasSwitch && (
          <button onClick={() => setSwitchClosed(p => !p)} style={{ background: switchClosed ? '#ef4444' : '#10b981', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', height: '42px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Power size={16} /> {switchClosed ? 'Open' : 'Close'}
          </button>
        )}
      </div>
    </div>
  );
};
