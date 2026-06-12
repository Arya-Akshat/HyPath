import React, { useEffect, useRef } from 'react';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  depth: number;
  wanderAngle: number;
  wanderSpeed: number;
}

export const GeminiBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Google AI inspired pastel neon palette
    const colors = [
      'rgba(168, 85, 247, 0.7)', // Violet
      'rgba(59, 130, 246, 0.7)', // Blue
      'rgba(6, 182, 212, 0.7)',  // Cyan
      'rgba(236, 72, 153, 0.7)', // Pink
    ];

    // Scatter orbs randomly across the full canvas
    const orbs: Orb[] = [];
    const ORB_COUNT = 80;

    for (let i = 0; i < ORB_COUNT; i++) {
      const depth = 0.4 + Math.random() * 0.9;
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: 8 + Math.random() * 22 * depth,
        color: colors[Math.floor(Math.random() * colors.length)],
        depth,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderSpeed: 0.002 + Math.random() * 0.004,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.isHovering = false;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    mouseRef.current.targetX = width / 2;
    mouseRef.current.targetY = height / 2;

    const render = () => {
      // Clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.globalCompositeOperation = 'source-over'; 
      
      orbs.forEach(orb => {
        // Slowly rotate wander direction for organic drift
        orb.wanderAngle += orb.wanderSpeed;
        orb.vx += Math.cos(orb.wanderAngle) * 0.02;
        orb.vy += Math.sin(orb.wanderAngle) * 0.02;

        // Clamp speed
        const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        const maxSpeed = 1.2;
        if (speed > maxSpeed) { orb.vx = (orb.vx / speed) * maxSpeed; orb.vy = (orb.vy / speed) * maxSpeed; }

        // Mouse push-away influence
        const dx = orb.x - mouse.x;
        const dy = orb.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = 220;
        if (dist < influence && dist > 0) {
          const force = ((influence - dist) / influence) * 1.8;
          orb.vx += (dx / dist) * force * 0.3;
          orb.vy += (dy / dist) * force * 0.3;
        }

        orb.x += orb.vx;
        orb.y += orb.vy;

        // Wrap around edges with a small margin
        const margin = orb.radius;
        if (orb.x < -margin) orb.x = width + margin;
        if (orb.x > width + margin) orb.x = -margin;
        if (orb.y < -margin) orb.y = height + margin;
        if (orb.y > height + margin) orb.y = -margin;

        // Draw soft glowing blob
        const grad = ctx.createRadialGradient(
          orb.x, orb.y, 0, 
          orb.x, orb.y, orb.radius
        );
        
        // Solid core blending smoothly to a soft edge
        grad.addColorStop(0, orb.color.replace(/[\d.]+\)$/g, '0.9)'));
        grad.addColorStop(0.4, orb.color.replace(/[\d.]+\)$/g, '0.5)'));
        grad.addColorStop(1, orb.color.replace(/[\d.]+\)$/g, '0)'));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 bg-white"
      style={{
        // A very slight blur to make the distinct blobs look like soft plasma mesh nodes
        filter: 'blur(8px) saturate(1.3)', 
      }}
    />
  );
};
