import React, { useEffect, useRef } from 'react';

interface Orb {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  depth: number;
  baseX: number;
  baseY: number;
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

    // Initialize globular beads arranged in concentric rings (co-circular formations)
    const orbs: Orb[] = [];
    const ringCount = 5;
    const beadsPerRing = [16, 24, 32, 40, 52]; // Doubled number of beads per ring
    const ringRadii = [150, 300, 480, 700, 950]; // Increased radii for more distance between rings

    const centerX = width / 2;
    const centerY = height / 2;

    for (let r = 0; r < ringCount; r++) {
      const radius = ringRadii[r];
      const count = beadsPerRing[r];

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        const orbitSpeed = (0.0003 + Math.random() * 0.0006) * (r % 2 === 0 ? 1 : -1);
        const depth = 0.5 + (r / ringCount) * 1.0; // Foreground/background scaling

        orbs.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          targetX: centerX + Math.cos(angle) * radius,
          targetY: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          radius: 4 + Math.random() * 6 + (1 - depth) * 4, // Decreased size by more than half
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.4 + Math.random() * 0.4,
          angle,
          orbitRadius: radius,
          orbitSpeed,
          depth,
          baseX: centerX,
          baseY: centerY,
        });
      }
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
      
      orbs.forEach(orb => {
        orb.baseX = width / 2;
        orb.baseY = height / 2;
      });
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
        orb.angle += orb.orbitSpeed;
        
        // Gentle organic pulsing in radius
        const pulse = Math.sin(orb.angle * 3) * 20;
        const targetOrbitRadius = orb.orbitRadius + pulse;

        const homeX = orb.baseX + Math.cos(orb.angle) * targetOrbitRadius;
        const homeY = orb.baseY + Math.sin(orb.angle) * targetOrbitRadius;

        let dx = mouse.x - homeX;
        let dy = mouse.y - homeY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = homeX;
        let targetY = homeY;

        if (mouse.isHovering || dist < 400) {
          const maxInfluence = 400;
          const force = (maxInfluence - Math.min(dist, maxInfluence)) / maxInfluence; 
          
          // Smooth halo effect around the cursor:
          // Pushes away if too close, pulls in if inside the influence radius
          const targetDist = 140 * orb.depth; 
          const pushPull = (dist - targetDist) * 0.5 * force;
          
          if (dist > 0) {
            targetX += (dx / dist) * pushPull;
            targetY += (dy / dist) * pushPull;
          }
        }

        const parallaxFactor = 0.06 * (orb.depth - 0.5);
        targetX += (mouse.x - width / 2) * parallaxFactor;
        targetY += (mouse.y - height / 2) * parallaxFactor;

        orb.x += (targetX - orb.x) * 0.06;
        orb.y += (targetY - orb.y) * 0.06;

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
