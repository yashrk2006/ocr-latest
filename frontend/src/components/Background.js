import React from 'react';

const Background = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      zIndex: -1,
      background: '#030712', /* Base dark */
      overflow: 'hidden'
    }}>
      {/* Grid Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        pointerEvents: 'none'
      }} />

      {/* Primary Glow Orb */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        animation: 'float 20s infinite ease-in-out'
      }} />

      {/* Secondary Glow Orb */}
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '10%',
        width: '35vw',
        height: '35vw',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1), transparent 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        animation: 'float-reverse 25s infinite ease-in-out'
      }} />

      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 40px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes float-reverse {
          0% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
};

export default Background;
