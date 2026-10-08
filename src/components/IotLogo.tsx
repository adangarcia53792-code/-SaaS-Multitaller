import React from 'react';

export interface IotLogoProps {
  variant?: 'light' | 'dark'; // 'light' para fondos oscuros (menú lateral), 'dark' para fondos claros (encabezado, inicio de sesión, documentos)
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

/**
 * Logotipo oficial de IOT Technologies con la leyenda "Business Innovation Solutions".
 * 
 * Directrices:
 * - En fondos blancos: se muestra directamente con excelente nitidez.
 * - En el menú lateral azul: se coloca sobre un contenedor blanco discreto con esquinas ligeramente redondeadas para garantizar legibilidad y preservar los colores originales del logo.
 */
export const IotLogo: React.FC<IotLogoProps> = ({
  variant = 'dark',
  className = '',
  size = 'md',
}) => {
  // Escala de altura manteniendo la proporción panorámica (~5.4:1)
  const heightClasses = {
    xs: 'h-5',
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
    xl: 'h-14 sm:h-16',
  }[size];

  // En menú lateral azul: contenedor blanco discreto con esquinas ligeramente redondeadas
  if (variant === 'light') {
    return (
      <div
        className={`inline-flex items-center justify-center bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-2xs border border-white/40 select-none ${className}`}
        title="IOT Technologies - Business Innovation Solutions"
      >
        <img
          src="/iot-logo.png"
          alt="IOT Technologies - Business Innovation Solutions"
          className={`${heightClasses} w-auto object-contain shrink-0`}
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith('.svg')) {
              target.src = '/iot-logo.svg';
            }
          }}
        />
      </div>
    );
  }

  // En fondos blancos o claros: directo con alta nitidez
  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      title="IOT Technologies - Business Innovation Solutions"
    >
      <img
        src="/iot-logo.png"
        alt="IOT Technologies - Business Innovation Solutions"
        className={`${heightClasses} w-auto object-contain shrink-0`}
        loading="eager"
        decoding="async"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith('.svg')) {
            target.src = '/iot-logo.svg';
          }
        }}
      />
    </div>
  );
};
