import React from 'react';

export type TunnoLogoVariant = 'positive' | 'negative' | 'dark' | 'light' | 'monochrome';
export type TunnoLogoFormat = 'horizontal' | 'principal' | 'reducida' | 'isotipo';
export type TunnoLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface TunnoLogoProps {
  variant?: TunnoLogoVariant; // 'positive'/'dark' para fondos claros; 'negative'/'light' para fondos oscuros (#06345A)
  format?: TunnoLogoFormat;   // 'horizontal', 'principal', 'reducida', 'isotipo'
  size?: TunnoLogoSize;       // 'xs', 'sm', 'md', 'lg', 'xl'
  className?: string;
  showSubtitle?: boolean;
}

/**
 * Logotipo oficial de TUNNO según el Manual de Identidad Corporativa.
 * Lema: "Tu taller. Tu control."
 * Frase institucional: "Organiza · Controla · Haz crecer"
 */
export const TunnoLogo: React.FC<TunnoLogoProps> = ({
  variant = 'positive',
  format = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const isDarkBg = variant === 'negative' || variant === 'light';

  // Dimensiones según tamaño y formato
  const sizeMapHorizontal = {
    xs: 'h-6',
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  };

  const sizeMapIsotipo = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const sizeMapVertical = {
    xs: 'h-12',
    sm: 'h-16',
    md: 'h-24',
    lg: 'h-32',
    xl: 'h-40',
  };

  // Formato: ISOTIPO ÚNICAMENTE
  if (format === 'isotipo') {
    const src = isDarkBg ? '/tunno-isotipo-negative.svg' : '/tunno-isotipo.svg';
    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        title="TUNNO - Tu taller. Tu control."
      >
        <img
          src={src}
          alt="TUNNO Isotipo"
          className={`${sizeMapIsotipo[size]} object-contain shrink-0`}
          loading="eager"
        />
      </div>
    );
  }

  // Formato: PRINCIPAL (Vertical apilado con lema)
  if (format === 'principal') {
    return (
      <div
        className={`inline-flex flex-col items-center select-none shrink-0 ${className}`}
        title="TUNNO - Tu taller. Tu control."
      >
        <img
          src="/tunno-logo-principal.svg"
          alt="TUNNO - Tu taller. Tu control."
          className={`${sizeMapVertical[size]} w-auto object-contain`}
          loading="eager"
        />
      </div>
    );
  }

  // Formato: REDUCIDA (Vertical apilado sin lema)
  if (format === 'reducida') {
    return (
      <div
        className={`inline-flex flex-col items-center select-none shrink-0 ${className}`}
        title="TUNNO"
      >
        <img
          src="/tunno-logo-reducida.svg"
          alt="TUNNO"
          className={`${sizeMapVertical[size]} w-auto object-contain`}
          loading="eager"
        />
      </div>
    );
  }

  // Formato: HORIZONTAL (Default para barras de navegación, encabezados, documentos)
  const logoSrc = isDarkBg
    ? '/tunno-logo-horizontal-negative.svg'
    : '/tunno-logo-horizontal.svg';

  return (
    <div
      className={`inline-flex items-center select-none shrink-0 ${className}`}
      title="TUNNO - Tu taller. Tu control."
    >
      <img
        src={logoSrc}
        alt="TUNNO - Tu taller. Tu control."
        className={`${sizeMapHorizontal[size]} w-auto object-contain`}
        loading="eager"
      />
    </div>
  );
};

// Compatibilidad hacia atrás con IotLogo
export const IotLogo = TunnoLogo;
export default TunnoLogo;
