import React from 'react';
import { SectionId, RolUsuario } from '../types';
import { GuiaInteractiva } from './GuiaInteractiva';
import { TipoGuia } from '../data/guiaData';

export interface RecorridoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection: (section: SectionId) => void;
  tipoGuia?: TipoGuia;
  pasoInicialIndex?: number;
  userRol?: RolUsuario;
  currentSection?: SectionId;
  isSectionAllowed?: (section: SectionId, rol?: RolUsuario) => boolean;
  onComplete?: () => void;
}

/**
 * RecorridoModal ahora renderiza la Guía interactiva de TUNNO con todas las mejoras:
 * Resaltado del elemento, progreso, explicaciones de ¿Para qué sirve?, ¿Qué hacer?,
 * ¿Qué sucede después?, atajos de teclado y adaptación por rol.
 */
export const RecorridoModal: React.FC<RecorridoModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSection,
  tipoGuia = 'general',
  pasoInicialIndex = 0,
  userRol,
  currentSection = 'dashboard',
  isSectionAllowed = () => true,
  onComplete,
}) => {
  return (
    <GuiaInteractiva
      isOpen={isOpen}
      tipoGuia={tipoGuia}
      pasoInicialIndex={pasoInicialIndex}
      userRol={userRol}
      currentSection={currentSection}
      onNavigateToSection={onNavigateToSection}
      isSectionAllowed={isSectionAllowed}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
};
