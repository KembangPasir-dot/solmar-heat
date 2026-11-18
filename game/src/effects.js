// SOLMAR HEAT — Visual Effects & Particles Manager (Revised & Polished)
export class EffectsManager {
  constructor() {
    this.particles = [];
    this.skidMarks = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
  }

  addSpark(x, y, color = '#f59e0b', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.04,
        size: 2 + Math.random() * 3.5,
        color
      });
    }
  }

  addSmoke(x, y, size = 15, color = 'rgba(100,100,100,0.4)') {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 1.0,
      life: 1.0,
      decay: 0.015,
      size: size + Math.random() * 10,
      color,
      isSmoke: true
    });
  }

  addSkidMark(x, y, angle) {
    if (this.skidMarks.length > 200) {
      this.skidMarks.shift();
    }
    this.skidMarks.push({ x, y, angle, life: 1.0 });
  }

  triggerScreenShake(intensity = 8, duration = 0.25) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  update(dt) {
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.isSmoke) {
        p.size += 0.2;
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const s = this.skidMarks[i];
      s.life -= 0.002;
      if (s.life <= 0) {
        this.skidMarks.splice(i, 1);
      }
    }
  }

  renderSkidMarks(ctx) {
    ctx.save();
    for (const s of this.skidMarks) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.fillStyle = `rgba(15, 23, 42, ${s.life * 0.5})`;
      ctx.fillRect(-4, -8, 8, 16);
      ctx.restore();
    }
    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  getCameraOffset() {
    if (this.screenShakeTime > 0) {
      const dx = (Math.random() - 0.5) * this.screenShakeIntensity;
      const dy = (Math.random() - 0.5) * this.screenShakeIntensity;
      return { x: dx, y: dy };
    }
    return { x: 0, y: 0 };
  }
}
