import React, { useMemo } from 'react';

const Background = () => {
  const colors = {
    purple: '#241379',
    'medium-blue': '#2185bf',
    'light-blue': '#1fbce1',
    red: '#b62f56',
    orange: '#d5764c',
    yellow: '#ffd53e',
    cyan: '#78ffba',
    'light-green': '#98fd85',
    lime: '#befb46',
    magenta: '#6c046c',
    'lightish-red': '#f04c81',
    pink: '#ff4293'
  };

  const styles = useMemo(() => {
    let css = '';
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    Object.entries(colors).forEach(([name, color]) => {
      const size = random(5, 50);
      const random1 = random(0, 100);
      const random2 = random(0, 100);

      // Keyframe values
      const random3 = random(0, 100);
      const random4 = random(0, 100);
      const random5 = random(0, 100);
      const random6 = random(0, 100);

      // Pseudo element values
      const pRandom3 = random(-100, 100);
      const pRandom4 = random(-100, 100);
      const pRandom5 = random(-100, 100);
      const pRandom6 = random(-100, 100);

      css += `
        .${name} {
          position: fixed;
          top: 0;
          left: 0;
          opacity: 0.9;
          width: ${size}px;
          height: ${size}px;
          border: 2px solid ${color};
          border-radius: 100%;
          transform: translate3d(${random1}vw, ${random2}vh, 0);
          z-index: ${random(1, 12)};
          animation: anim-${name} 30s linear infinite alternate;
        }

        .${name}::before, .${name}::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          border: 2px solid ${color};
          border-radius: 100%;
          opacity: 0.9;
        }

        .${name}::before {
          width: ${random(5, 50)}px;
          height: ${random(5, 50)}px;
          animation: anim-${name}-pseudo 15s linear infinite alternate;
          background: ${color};
        }

        .${name}::after {
          width: ${random(5, 50)}px;
          height: ${random(5, 50)}px;
          animation: anim-${name}-pseudo 20s linear infinite alternate;
        }

        @keyframes anim-${name} {
          50% { transform: translate3d(${random3}vw, ${random4}vh, 0); }
          100% { transform: translate3d(${random5}vw, ${random6}vh, 0); }
        }

        @keyframes anim-${name}-pseudo {
          33% { transform: translate3d(${pRandom3}vw, ${pRandom4}vh, 0) rotate(${random(0, 360)}deg); }
          100% { transform: translate3d(${pRandom5}vw, ${pRandom6}vh, 0) rotate(${random(0, 360)}deg); }
        }
      `;
    });

    return css;
  }, [colors]);

  return (
    <>
      <style>{styles}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: 'radial-gradient(circle, #24246e, #06051f)',
        overflow: 'hidden',
        zIndex: -1
      }}>
        {Object.keys(colors).map(name => (
          <div key={name} className={name} />
        ))}
      </div>
    </>
  );
};

export default Background;
