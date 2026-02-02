/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Modal Component
 * Reusable modal dialog with header, body, and footer
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect } from 'react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer,
  size = 'md' // sm, md, lg
}) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '500px' },
    lg: { maxWidth: '700px' },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        style={sizeStyles[size]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
