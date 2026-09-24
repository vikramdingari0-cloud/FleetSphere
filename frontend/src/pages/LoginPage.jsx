import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Radio, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('admin@fleetsphere.com');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#080c14',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background cyber glow accents */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '14px',
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)'
            }}
          >
            <Radio size={28} />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>
            FLEET<span style={{ color: '#0ea5e9' }}>SPHERE</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Enterprise Fleet Telematics & Logistics Operations
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Corporate Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@fleetsphere.com"
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '6px', height: '42px', fontSize: '14px' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Command Center'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Credentials Switcher */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <ShieldCheck size={14} color="#0ea5e9" />
            <span style={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Instant Demo Access Roles:
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DEMO_USERS.map((u) => (
              <button
                key={u.role}
                type="button"
                onClick={() => demoLogin(u.role)}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '11.5px',
                  justifyContent: 'flex-start',
                  padding: '7px 10px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor:
                      u.role === 'Super Admin'
                        ? '#0ea5e9'
                        : u.role === 'Fleet Manager'
                        ? '#10b981'
                        : u.role === 'Finance Officer'
                        ? '#8b5cf6'
                        : '#f59e0b'
                  }}
                />
                <span>{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
