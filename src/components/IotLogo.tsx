import React, { useState } from 'react';

interface IotLogoProps {
  variant?: 'light' | 'dark'; // 'light' para fondos oscuros (sidebar), 'dark' para fondos claros (header, login)
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

/**
 * Logotipo oficial de IOT Technologies.
 * Composición horizontal:
 * - Símbolo azul de antena
 * - Texto IOT (negro en fondo claro / blanco en fondo oscuro)
 * - Texto TECHNOLOGIES (azul #1D7EAE en fondo claro / azul claro #98DAE9 en fondo oscuro)
 * 
 * Deja preparado el espacio para cargar el archivo oficial (/iot-logo.svg o /iot-logo.png)
 * y si no existe aún en el proyecto, utiliza temporalmente la composición tipográfica y de símbolo oficial.
 */
export const IotLogo: React.FC<IotLogoProps> = ({
  variant = 'dark',
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // Dimensiones según tamaño
  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  }[size];

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  const subTextSizeClasses = {
    sm: 'text-[9px] tracking-[0.2em]',
    md: 'text-[11px] tracking-[0.25em]',
    lg: 'text-xs tracking-[0.3em]',
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  const isLight = variant === 'light'; // Fondo oscuro

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Si el archivo oficial está cargado se muestra con proporción preservada */}
      {!imgError ? (
        <img
          src={isLight ? '/iot-logo-white.svg' : '/iot-logo.svg'}
          alt="IOT Technologies"
          className={`${heightClasses} w-auto max-w-[220px] object-contain`}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Composición tipográfica y de símbolo oficial si no carga el archivo */
        <div className="flex items-center gap-2">
          {/* Símbolo azul de antena con ondas */}
          <div
            className={`shrink-0 flex items-center justify-center ${
              isLight ? 'text-[#98DAE9]' : 'text-[#1D7EAE]'
            }`}
            aria-hidden="true"
          >
            <svg
              className={iconSizes}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21V11" />
              <path d="M9 21h6" />
              <circle cx="12" cy="10" r="1.5" fill="currentColor" />
              <path d="M8.5 7a5 5 0 0 1 7 0" />
              <path d="M5.5 4a9.5 9.5 0 0 1 13 0" />
            </svg>
          </div>

          {/* Tipografía IOT TECHNOLOGIES */}
          <div className="flex flex-col justify-center leading-none">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span
                className={`font-bold font-sans tracking-tight leading-none ${textSizeClasses} ${
                  isLight ? 'text-white' : 'text-[#231F20]'
                }`}
              >
                IOT
              </span>
              <span
                className={`font-semibold font-sans uppercase leading-none ${subTextSizeClasses} ${
                  isLight ? 'text-[#98DAE9]' : 'text-[#1D7EAE]'
                }`}
              >
                TECHNOLOGIES
              </span>
            </div>
            {showSubtitle && (
              <span
                className={`text-[10px] tracking-wide mt-1 font-medium ${
                  isLight ? 'text-blue-200/80' : 'text-[#5F6B73]'
                }`}
              >
                Sistema de Talleres Mecánicos
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
