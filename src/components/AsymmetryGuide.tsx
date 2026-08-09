import React from 'react';
import { ShieldAlert, Sparkles, AlertTriangle, Activity } from 'lucide-react';

export const AsymmetryGuide: React.FC = () => {
  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Hero Banner */}
      <div className="glass-panel" style={{ padding: '28px', background: 'linear-gradient(135deg, rgba(176, 38, 255, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)', border: '1px solid rgba(176, 38, 255, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(176, 38, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D8B4FE',
          }}>
            <Activity size={26} />
          </div>
          <div>
            <span className="badge left-scapula-badge">TARGETED BIOMECHANICS</span>
            <h2 style={{ fontSize: '1.7rem', fontWeight: '900', color: '#FFFFFF', marginTop: '4px' }}>
              Left Scapula, Handstand Wrists & Hamstring Form Guide
            </h2>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginTop: '12px', lineHeight: 1.6 }}>
          Mastering asymmetric scapular engagement, wrist tendon preservation during overhead balance, and safe spinal articulation for your 60-minute session.
        </p>
      </div>

      {/* Grid of Key Technical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Left Scapular Wrapping */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(176, 38, 255, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Sparkles size={20} color="#D8B4FE" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF' }}>
              1. Left Scapular Wrapping
            </h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
            When performing your 4–5 working sets of pull-ups, start each set with <strong>3 slow scapular pull-ups</strong> specifically focusing on wrapping your left shoulder blade down and back into your back pocket.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', fontSize: '0.84rem', color: '#D8B4FE', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>✔️ <strong>Cue 1:</strong> Imagine pulling left elbow into hip socket before flexing arms.</div>
            <div>✔️ <strong>Cue 2:</strong> Pause 2 full seconds at the peak of the scapular retraction.</div>
            <div>✔️ <strong>Cue 3:</strong> Keep ribcage pulled down (hollow body) to prevent lower back arching.</div>
          </div>
        </div>

        {/* Card 2: Handstand Wrist Management */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ShieldAlert size={20} color="#00F0FF" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF' }}>
              2. Handstand Wrist Relief
            </h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
            During the 10-minute Chest-to-Wall Handstand & Balance block, heavy wrist extension can create joint compression if not properly primed.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', fontSize: '0.84rem', color: '#00F0FF', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>💡 <strong>Parallettes Option:</strong> Neutral wrist grip on blocks drastically reduces extension angle.</div>
            <div>💡 <strong>Finger Steering:</strong> Press finger pads into floor like playing piano keys to balance.</div>
            <div>💡 <strong>Bail Safety:</strong> Cartwheel off wall safely if shoulders or wrists fatigue.</div>
          </div>
        </div>

        {/* Card 3: Modified Jefferson Curls */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255, 0, 122, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={20} color="#FF007A" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF' }}>
              3. Modified Jefferson Curls
            </h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
            Jefferson curls flex the spine segment by segment. This builds hamstring & spinal tissue resilience when performed under controlled, ultra-light loads.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', fontSize: '0.84rem', color: '#FF007A', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>⚠️ <strong>Weight Limit:</strong> 5–10 lbs max! This is a mobility movement, not a heavy lift.</div>
            <div>⚠️ <strong>Segmentation:</strong> Chin to chest → upper spine → mid spine → lumbar roll.</div>
            <div>⚠️ <strong>Slow Tempo:</strong> Take 5 full seconds down and 5 full seconds up.</div>
          </div>
        </div>

      </div>
    </div>
  );
};
