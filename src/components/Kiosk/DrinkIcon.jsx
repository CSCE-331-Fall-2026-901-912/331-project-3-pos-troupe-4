import React from 'react';

export default function DrinkIcon({ name, size = 68 }) {
  const lower = (name || '').toLowerCase();

  let primaryColor = '#9E7852';
  let secondaryColor = '#D4A373';

  if (lower.includes('taro') || lower.includes('lavender')) {
    primaryColor = '#7A5299';
    secondaryColor = '#BA98D4';
  } else if (lower.includes('thai')) {
    primaryColor = '#D95C14';
    secondaryColor = '#F79A52';
  } else if (lower.includes('brown sugar') || lower.includes('caramel') || lower.includes('toffee')) {
    primaryColor = '#4A2A0C';
    secondaryColor = '#A86D37';
  } else if (lower.includes('green') || lower.includes('matcha')) {
    primaryColor = '#4C7B42';
    secondaryColor = '#8FB878';
  } else if (lower.includes('berry') || lower.includes('strawberry') || lower.includes('lychee')) {
    primaryColor = '#B82E4D';
    secondaryColor = '#EB7189';
  } else if (lower.includes('mango') || lower.includes('peach') || lower.includes('lemonade') || lower.includes('orange')) {
    primaryColor = '#D9780D';
    secondaryColor = '#F7B743';
  } else if (lower.includes('coffee') || lower.includes('creama')) {
    primaryColor = '#382013';
    secondaryColor = '#7E573C';
  } else if (lower.includes('chai') || lower.includes('honey') || lower.includes('oolong')) {
    primaryColor = '#A36818';
    secondaryColor = '#DCA042';
  }

  const gradId = `drink-grad-${(name || 'default').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;

  return (
    <svg width={size} height={Math.round(size * 1.22)} viewBox="0 0 100 122" fill="none" xmlns="http://www.w3.org/2000/svg" className="drink-icon-svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
      </defs>

      {/* Straw */}
      <path d="M55 6 L65 38" stroke="#E63946" strokeWidth="6" strokeLinecap="round" />
      <path d="M56 8 L64 34" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />

      {/* Cup Body */}
      <path d="M22 36 L29 108 Q31 116 41 116 L59 116 Q69 116 71 108 L78 36 Z" fill={`url(#${gradId})`} />

      {/* Glass Reflection Highlight */}
      <path d="M26 40 L32 104" stroke="rgba(255,255,255,0.45)" strokeWidth="3.5" strokeLinecap="round" />

      {/* Ice Cubes */}
      <rect x="36" y="48" width="14" height="12" rx="3" fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.7)" strokeWidth="1" transform="rotate(-10 43 54)" />
      <rect x="52" y="54" width="13" height="11" rx="3" fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.7)" strokeWidth="1" transform="rotate(15 58 59)" />

      {/* Boba Pearls */}
      <circle cx="38" cy="104" r="5.2" fill="#17120E" opacity="0.95" />
      <circle cx="50" cy="106" r="5.5" fill="#17120E" opacity="0.95" />
      <circle cx="62" cy="104" r="5.2" fill="#17120E" opacity="0.95" />
      <circle cx="44" cy="96" r="5" fill="#261E18" opacity="0.9" />
      <circle cx="56" cy="97" r="5.2" fill="#261E18" opacity="0.9" />
      <circle cx="36" cy="92" r="4.6" fill="#17120E" opacity="0.85" />
      <circle cx="64" cy="93" r="4.6" fill="#17120E" opacity="0.85" />

      {/* Lid Dome & Rim */}
      <path d="M25 36 C25 23, 75 23, 75 36" fill="rgba(255,255,255,0.4)" stroke="#C8D4CD" strokeWidth="2" />
      <ellipse cx="50" cy="36" rx="29" ry="5.5" fill="#E8EFEA" stroke="#B2C2B8" strokeWidth="2" />
    </svg>
  );
}
