import React, { useState, useMemo, useEffect } from 'react';
import { Cliente, Vehiculo, Cita, Cotizacion, OrdenTrabajo, ServicioCatalogo } from '../types';
import { CheckCircle2, RotateCcw, Calendar, FileText, Wrench, ArrowLeft, ArrowRight, Check, PlusCircle } from 'lucide-react';

interface NuevaAtencionSectionProps {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  servicios: ServicioCatalogo[];
  cotizacionesCount: number;
  ordenesCount: number;
  onSaveNewClientAndVehicle: (client: Cliente, veh: Vehiculo) => void;
  onSaveCita: (cita: Cita) => void;
  onSaveCotizacion: (cot: Cotizacion) => void;
  onSaveOrden: (ord: OrdenTrabajo) => void;
}

type TipoAtencion = 'cita' | 'cotizacion' | 'orden';

export const NuevaAtencionSection: React.FC<NuevaAtencionSectionProps> = ({
  clientes,
  vehiculos,
  servicios,
  cotizacionesCount,
  ordenesCount,
  onSaveNewClientAndVehicle,
  onSaveCita,
  onSaveCotizacion,
  onSaveOrden,
}) => {
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardSubmitted, setWizardSubmitted] = useState<boolean>(false);
  const [confirmedResult, setConfirmedResult] = useState<{
    tipo: TipoAtencion;
    folio?: string;
    clienteNombre: string;
    vehiculoDesc: string;
  } | null>(null);

  // Step 1: Mode
  const [isNewClientAndVehicle, setIsNewClientAndVehicle] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>('');

  // New Client fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // New Vehicle fields
  const [newVehBrand, setNewVehBrand] = useState('');
  const [newVehModel, setNewVehModel] = useState('');
  const [newVehPlates, setNewVehPlates] = useState('');
  const [newVehYear, setNewVehYear] = useState('');

  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2: Qué necesita
  const [tipoAtencion, setTipoAtencion] = useState<TipoAtencion>('cita');

  // Step 3: Catalog selectors
  const [selectedCatalogIdCita, setSelectedCatalogIdCita] = useState('');
  const [selectedCatalogIdCot, setSelectedCatalogIdCot] = useState('');
  const [selectedCatalogIdOrden, setSelectedCatalogIdOrden] = useState('');

  // Step 3: Datos
  const [citaServicio, setCitaServicio] = useState('');
  const [citaFecha, setCitaFecha] = useState('');
  const [citaHora, setCitaHora] = useState('');

  const [cotDescripcion, setCotDescripcion] = useState('');
  const [cotRefacciones, setCotRefacciones] = useState<string>('0');
  const [cotManoObra, setCotManoObra] = useState<string>('0');

  const [ordenServicio, setOrdenServicio] = useState('');
  const [ordenKm, setOrdenKm] = useState('');
  const [ordenObservaciones, setOrdenObservaciones] = useState('');

  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const activeServicios = useMemo(
    () => servicios.filter((s) => s.activo),
    [servicios]
  );

  const clienteMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    clientes.forEach((c) => map.set(c.id, c));
    return map;
  }, [clientes]);

  const normalizePlates = (plate: string) => plate.replace(/\s+/g, '').toUpperCase();

  // Set default client
  useEffect(() => {
    if (!selectedClientId && clientes.length > 0) {
      setSelectedClientId(clientes[0].id);
    }
  }, [clientes, selectedClientId]);

  // Available vehicles for selected client
  const vehiclesForClient = useMemo(() => {
    if (!selectedClientId) return [];
    return vehiculos.filter((v) => v.clienteId === selectedClientId);
  }, [vehiculos, selectedClientId]);

  useEffect(() => {
    if (!isNewClientAndVehicle && vehiclesForClient.length > 0) {
      if (!vehiclesForClient.some((v) => v.id === selectedVehiculoId)) {
        setSelectedVehiculoId(vehiclesForClient[0].id);
      }
    }
  }, [vehiclesForClient, selectedVehiculoId, isNewClientAndVehicle]);

  const resetWizard = () => {
    setWizardStep(1);
    setWizardSubmitted(false);
    setConfirmedResult(null);
    setIsNewClientAndVehicle(false);
    setSelectedClientId(clientes[0]?.id || '');
    setSelectedVehiculoId('');
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewVehBrand('');
    setNewVehModel('');
    setNewVehPlates('');
    setNewVehYear('');
    setStep1Errors({});
    setTipoAtencion('cita');
    setSelectedCatalogIdCita('');
    setSelectedCatalogIdCot('');
    setSelectedCatalogIdOrden('');
    setCitaServicio('');
    setCitaFecha('');
    setCitaHora('');
    setCotDescripcion('');
    setCotRefacciones('0');
    setCotManoObra('0');
    setOrdenServicio('');
    setOrdenKm('');
    setOrdenObservaciones('');
    setStep3Errors({});
    setIsSaving(false);
  };

  const handleSelectCatalogCita = (servId: string) => {
    setSelectedCatalogIdCita(servId);
    if (!servId) return;
    const found = activeServicios.find((s) => s.id === servId);
    if (!found) return;

    if (citaServicio.trim() && citaServicio.trim() !== found.nombre) {
      const confirmReplace = window.confirm(
        'Ya escribiste un servicio solicitado. ¿Deseas sustituirlo con los datos del catálogo?'
      );
      if (!confirmReplace) {
        setSelectedCatalogIdCita('');
        return;
      }
    }

    setCitaServicio(found.nombre);
    if (step3Errors.citaServicio) setStep3Errors((prev) => ({ ...prev, citaServicio: '' }));
  };

  const handleSelectCatalogCot = (servId: string) => {
    setSelectedCatalogIdCot(servId);
    if (!servId) return;
    const found = activeServicios.find((s) => s.id === servId);
    if (!found) return;

    const hasData =
      cotDescripcion.trim().length > 0 ||
      (parseFloat(cotRefacciones) || 0) > 0 ||
      (parseFloat(cotManoObra) || 0) > 0;

    if (hasData) {
      const confirmReplace = window.confirm(
        'Ya escribiste datos en la cotización. ¿Deseas sustituirlos con los datos del catálogo?'
      );
      if (!confirmReplace) {
        setSelectedCatalogIdCot('');
        return;
      }
    }

    setCotDescripcion(found.nombre + (found.descripcion ? ': ' + found.descripcion : ''));
    setCotRefacciones(found.importeRefacciones.toString());
    setCotManoObra(found.importeManoObra.toString());
    if (step3Errors.cotDescripcion) setStep3Errors((prev) => ({ ...prev, cotDescripcion: '' }));
  };

  const handleSelectCatalogOrden = (servId: string) => {
    setSelectedCatalogIdOrden(servId);
    if (!servId) return;
    const found = activeServicios.find((s) => s.id === servId);
    if (!found) return;

    if (ordenServicio.trim() && ordenServicio.trim() !== found.nombre) {
      const confirmReplace = window.confirm(
        'Ya escribiste una descripción del trabajo. ¿Deseas sustituirla con los datos del catálogo?'
      );
      if (!confirmReplace) {
        setSelectedCatalogIdOrden('');
        return;
      }
    }

    setOrdenServicio(found.nombre + (found.descripcion ? ': ' + found.descripcion : ''));
    if (step3Errors.ordenServicio) setStep3Errors((prev) => ({ ...prev, ordenServicio: '' }));
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (isNewClientAndVehicle) {
      if (!newClientName.trim()) errors.clientName = 'El nombre del cliente es obligatorio.';
      if (!newClientPhone.trim()) errors.clientPhone = 'El teléfono del cliente es obligatorio.';
      if (!newVehBrand.trim()) errors.vehBrand = 'La marca del vehículo es obligatoria.';
      if (!newVehModel.trim()) errors.vehModel = 'El modelo del vehículo es obligatorio.';
      if (!newVehPlates.trim()) {
        errors.vehPlates = 'Las placas son obligatorias.';
      } else {
        const norm = normalizePlates(newVehPlates);
        if (vehiculos.some((v) => normalizePlates(v.placas) === norm)) {
          errors.vehPlates = 'Ya existe un vehículo registrado con estas placas.';
        }
      }
    } else {
      if (!selectedClientId) errors.selectedClient = 'Debe seleccionar un cliente registrado.';
      if (!selectedVehiculoId) errors.selectedVehiculo = 'Debe seleccionar un vehículo para este cliente.';
    }

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};

    if (tipoAtencion === 'cita') {
      if (!citaServicio.trim()) errors.citaServicio = 'El servicio solicitado es obligatorio.';
      if (!citaFecha.trim()) errors.citaFecha = 'La fecha de la cita es obligatoria.';
      if (!citaHora.trim()) errors.citaHora = 'La hora de la cita es obligatoria.';
    } else if (tipoAtencion === 'cotizacion') {
      if (!cotDescripcion.trim()) errors.cotDescripcion = 'La descripción del trabajo es obligatoria.';
      const refVal = parseFloat(cotRefacciones);
      const moVal = parseFloat(cotManoObra);
      if (isNaN(refVal) || refVal < 0) errors.cotRefacciones = 'Ingrese un importe válido para refacciones.';
      if (isNaN(moVal) || moVal < 0) errors.cotManoObra = 'Ingrese un importe válido para mano de obra.';
    } else if (tipoAtencion === 'orden') {
      if (!ordenServicio.trim()) errors.ordenServicio = 'El servicio solicitado es obligatorio.';
      if (!ordenKm.trim()) errors.ordenKm = 'El kilometraje del vehículo es obligatorio.';
    }

    setStep3Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!validateStep1()) return;
      setWizardStep(2);
    } else if (wizardStep === 2) {
      setWizardStep(3);
    } else if (wizardStep === 3) {
      if (!validateStep3()) return;
      setWizardStep(4);
    }
  };

  const handleConfirmAtencion = () => {
    if (isSaving || wizardSubmitted) return;
    setIsSaving(true);

    let finalClientId = selectedClientId;
    let finalVehiculoId = selectedVehiculoId;
    let clientDisplayName = '';
    let vehicleDisplayDesc = '';

    if (isNewClientAndVehicle) {
      const newClientId = `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newClientObj: Cliente = {
        id: newClientId,
        nombre: newClientName.trim(),
        telefono: newClientPhone.trim(),
        correo: newClientEmail.trim() || undefined,
      };

      const newVehId = `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newVehObj: Vehiculo = {
        id: newVehId,
        clienteId: newClientId,
        marca: newVehBrand.trim(),
        modelo: newVehModel.trim(),
        placas: newVehPlates.trim().toUpperCase(),
        año: newVehYear.trim() || undefined,
      };

      finalClientId = newClientId;
      finalVehiculoId = newVehId;
      clientDisplayName = newClientObj.nombre;
      vehicleDisplayDesc = `${newVehObj.marca} ${newVehObj.modelo} (${newVehObj.placas})`;

      onSaveNewClientAndVehicle(newClientObj, newVehObj);
    } else {
      const client = clienteMap.get(selectedClientId);
      const vehicle = vehiculos.find((v) => v.id === selectedVehiculoId);
      clientDisplayName = client?.nombre || 'Cliente';
      vehicleDisplayDesc = vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.placas})` : 'Vehículo';
    }

    const timestamp = new Date().toISOString();
    let generatedFolio = '';

    if (tipoAtencion === 'cita') {
      const newCita: Cita = {
        id: `cita-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        clienteId: finalClientId,
        vehiculoId: finalVehiculoId,
        servicio: citaServicio.trim(),
        fecha: citaFecha,
        hora: citaHora,
        estado: 'Programada',
        creadoEn: timestamp,
      };
      onSaveCita(newCita);
    } else if (tipoAtencion === 'cotizacion') {
      const count = cotizacionesCount + 1;
      generatedFolio = `COT-${String(count).padStart(3, '0')}`;
      const refVal = parseFloat(cotRefacciones) || 0;
      const moVal = parseFloat(cotManoObra) || 0;
      const newCot: Cotizacion = {
        id: `cot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        folio: generatedFolio,
        clienteId: finalClientId,
        vehiculoId: finalVehiculoId,
        descripcion: cotDescripcion.trim(),
        importeRefacciones: refVal,
        importeManoObra: moVal,
        total: refVal + moVal,
        estado: 'Por autorizar',
        creadoEn: timestamp,
      };
      onSaveCotizacion(newCot);
    } else if (tipoAtencion === 'orden') {
      const count = ordenesCount + 1;
      generatedFolio = `ORD-${String(count).padStart(3, '0')}`;
      const newOrd: OrdenTrabajo = {
        id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        folio: generatedFolio,
        clienteId: finalClientId,
        vehiculoId: finalVehiculoId,
        servicio: ordenServicio.trim(),
        kilometraje: ordenKm.trim(),
        observaciones: ordenObservaciones.trim() || undefined,
        estado: 'Por autorizar',
        creadoEn: timestamp,
      };
      onSaveOrden(newOrd);
    }

    setConfirmedResult({
      tipo: tipoAtencion,
      folio: generatedFolio,
      clienteNombre: clientDisplayName,
      vehiculoDesc: vehicleDisplayDesc,
    });
    setWizardSubmitted(true);
    setIsSaving(false);
  };

  const cotTotal = (parseFloat(cotRefacciones) || 0) + (parseFloat(cotManoObra) || 0);

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Nueva atención */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE] shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Nueva atención
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Registra citas, cotizaciones u órdenes de trabajo en sencillos pasos.
            </p>
          </div>
        </div>
      </div>

      {wizardSubmitted && confirmedResult ? (
        <div className="bg-white rounded-xl border border-[#DDE4E8] p-8 shadow-xs text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-sky-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[#231F20]">
              ¡Atención registrada con éxito!
            </h3>
            <p className="text-[#5F6B73] mt-2 text-sm">
              La información ha sido guardada correctamente en el sistema.
            </p>
          </div>

          <div className="bg-[#F6F8FA] border border-[#DDE4E8] rounded-lg p-5 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[#5F6B73]">Tipo:</span>
              <span className="font-semibold text-[#231F20] capitalize">
                {confirmedResult.tipo === 'cita' && 'Cita (Programada)'}
                {confirmedResult.tipo === 'cotizacion' && 'Cotización (Por autorizar)'}
                {confirmedResult.tipo === 'orden' && 'Orden de trabajo (Por autorizar)'}
              </span>
            </div>
            {confirmedResult.folio && (
              <div className="flex justify-between">
                <span className="text-[#5F6B73]">Folio asignado:</span>
                <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                  {confirmedResult.folio}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#5F6B73]">Cliente:</span>
              <span className="font-medium text-[#231F20]">{confirmedResult.clienteNombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5F6B73]">Vehículo:</span>
              <span className="font-medium text-[#231F20]">{confirmedResult.vehiculoDesc}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={resetWizard}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white font-medium text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Iniciar otra atención</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step indicators */}
          <div className="bg-white border border-[#DDE4E8] rounded-xl p-4 shadow-xs">
            <div className="grid grid-cols-4 gap-2 text-center text-xs md:text-sm font-medium">
              <div
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  wizardStep === 1
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : wizardStep > 1
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-[#5F6B73] bg-[#F6F8FA]'
                }`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">1</span>
                <span className="hidden sm:inline">Cliente y Vehículo</span>
              </div>

              <div
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  wizardStep === 2
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : wizardStep > 2
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-[#5F6B73] bg-[#F6F8FA]'
                }`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">2</span>
                <span className="hidden sm:inline">Qué necesita</span>
              </div>

              <div
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  wizardStep === 3
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : wizardStep > 3
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-[#5F6B73] bg-[#F6F8FA]'
                }`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">3</span>
                <span className="hidden sm:inline">Datos</span>
              </div>

              <div
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  wizardStep === 4
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'text-[#5F6B73] bg-[#F6F8FA]'
                }`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">4</span>
                <span className="hidden sm:inline">Revisar y Guardar</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#DDE4E8] rounded-xl p-6 md:p-8 shadow-xs">
            {/* PASO 1 */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Paso 1: Cliente y Vehículo
                  </h3>
                  <p className="text-sm text-slate-500">
                    Elige si deseas seleccionar un registro existente o capturar un cliente y vehículo nuevos.
                  </p>
                </div>

                <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 max-w-md">
                  <button
                    type="button"
                    onClick={() => setIsNewClientAndVehicle(false)}
                    className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
                      !isNewClientAndVehicle
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cliente registrado
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewClientAndVehicle(true)}
                    className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
                      isNewClientAndVehicle
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Nuevo cliente y vehículo
                  </button>
                </div>

                {!isNewClientAndVehicle ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Seleccionar cliente <span className="text-red-500">*</span>
                      </label>
                      {clientes.length > 0 ? (
                        <select
                          value={selectedClientId}
                          onChange={(e) => setSelectedClientId(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                        >
                          {clientes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} — {c.telefono}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          No hay clientes registrados en el sistema. Puedes optar por registrar uno nuevo arriba.
                        </p>
                      )}
                      {step1Errors.selectedClient && (
                        <p className="text-xs text-red-600 mt-1">{step1Errors.selectedClient}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Seleccionar vehículo del cliente <span className="text-red-500">*</span>
                      </label>
                      {vehiclesForClient.length > 0 ? (
                        <select
                          value={selectedVehiculoId}
                          onChange={(e) => setSelectedVehiculoId(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                        >
                          {vehiclesForClient.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.marca} {v.modelo} {v.año ? `(${v.año})` : ''} — Placas: {v.placas}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 space-y-2">
                          <p>Este cliente aún no tiene vehículos registrados.</p>
                          <button
                            type="button"
                            onClick={() => setIsNewClientAndVehicle(true)}
                            className="text-xs font-semibold text-[#1D7EAE] hover:underline"
                          >
                            Cambiar a capturar cliente y vehículo nuevos
                          </button>
                        </div>
                      )}
                      {step1Errors.selectedVehiculo && (
                        <p className="text-xs text-red-600 mt-1">{step1Errors.selectedVehiculo}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-800 border-b pb-1">
                        Datos del nuevo cliente
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Nombre completo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="Ej. Roberto Gómez"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                              step1Errors.clientName ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                            }`}
                          />
                          {step1Errors.clientName && (
                            <p className="text-xs text-red-600 mt-1">{step1Errors.clientName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Teléfono <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            placeholder="Ej. 555-432-8765"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                              step1Errors.clientPhone ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                            }`}
                          />
                          {step1Errors.clientPhone && (
                            <p className="text-xs text-red-600 mt-1">{step1Errors.clientPhone}</p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Correo electrónico <span className="text-slate-400 font-normal">(Opcional)</span>
                          </label>
                          <input
                            type="email"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            placeholder="Ej. roberto@email.com"
                            className="w-full px-3 py-2 border border-[#DDE4E8] rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-800 border-b pb-1">
                        Datos del nuevo vehículo
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Marca <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newVehBrand}
                            onChange={(e) => setNewVehBrand(e.target.value)}
                            placeholder="Ej. Honda"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                              step1Errors.vehBrand ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                            }`}
                          />
                          {step1Errors.vehBrand && (
                            <p className="text-xs text-red-600 mt-1">{step1Errors.vehBrand}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Modelo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newVehModel}
                            onChange={(e) => setNewVehModel(e.target.value)}
                            placeholder="Ej. Civic"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                              step1Errors.vehModel ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                            }`}
                          />
                          {step1Errors.vehModel && (
                            <p className="text-xs text-red-600 mt-1">{step1Errors.vehModel}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Placas <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newVehPlates}
                            onChange={(e) => setNewVehPlates(e.target.value)}
                            placeholder="Ej. DEF-456"
                            className={`w-full px-3 py-2 border rounded-lg text-sm uppercase focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                              step1Errors.vehPlates ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                            }`}
                          />
                          {step1Errors.vehPlates && (
                            <p className="text-xs text-red-600 mt-1">{step1Errors.vehPlates}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Año <span className="text-slate-400 font-normal">(Opcional)</span>
                          </label>
                          <input
                            type="text"
                            value={newVehYear}
                            onChange={(e) => setNewVehYear(e.target.value)}
                            placeholder="Ej. 2023"
                            className="w-full px-3 py-2 border border-[#DDE4E8] rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PASO 2 */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Paso 2: ¿Qué necesita?
                  </h3>
                  <p className="text-sm text-slate-500">
                    Selecciona el tipo de servicio que requiere el cliente.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => setTipoAtencion('cita')}
                    className={`cursor-pointer rounded-xl p-5 border-2 transition-all flex flex-col justify-between ${
                      tipoAtencion === 'cita'
                        ? 'border-sky-500 bg-sky-50/40 shadow-xs'
                        : 'border-[#DDE4E8] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="p-3 bg-sky-50 text-sky-600 rounded-lg w-fit mb-3">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-[#231F20] text-base">Agendar una cita</h4>
                      <p className="text-xs text-[#5F6B73] mt-1.5 leading-relaxed">
                        Reserva un espacio en la agenda para revisión o mantenimiento futuro.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          tipoAtencion === 'cita'
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {tipoAtencion === 'cita' && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setTipoAtencion('cotizacion')}
                    className={`cursor-pointer rounded-xl p-5 border-2 transition-all flex flex-col justify-between ${
                      tipoAtencion === 'cotizacion'
                        ? 'border-sky-500 bg-sky-50/40 shadow-xs'
                        : 'border-[#DDE4E8] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="p-3 bg-sky-50 text-sky-600 rounded-lg w-fit mb-3">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-[#231F20] text-base">Solicitar una cotización</h4>
                      <p className="text-xs text-[#5F6B73] mt-1.5 leading-relaxed">
                        Presupuesto previo con desglose de refacciones y mano de obra.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          tipoAtencion === 'cotizacion'
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {tipoAtencion === 'cotizacion' && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setTipoAtencion('orden')}
                    className={`cursor-pointer rounded-xl p-5 border-2 transition-all flex flex-col justify-between ${
                      tipoAtencion === 'orden'
                        ? 'border-sky-500 bg-sky-50/40 shadow-xs'
                        : 'border-[#DDE4E8] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="p-3 bg-sky-50 text-sky-600 rounded-lg w-fit mb-3">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-[#231F20] text-base">Dejar el vehículo en el taller</h4>
                      <p className="text-xs text-[#5F6B73] mt-1.5 leading-relaxed">
                        Abrir una orden de trabajo directa sin necesidad de cita previa.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          tipoAtencion === 'orden'
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {tipoAtencion === 'orden' && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Paso 3: Datos de la atención
                  </h3>
                  <p className="text-sm text-slate-500">
                    {tipoAtencion === 'cita' && 'Ingresa los datos para programar la cita.'}
                    {tipoAtencion === 'cotizacion' && 'Ingresa la descripción y los importes de la cotización.'}
                    {tipoAtencion === 'orden' && 'Ingresa los datos de recepción para la orden de trabajo.'}
                  </p>
                </div>

                {tipoAtencion === 'cita' && (
                  <div className="space-y-4">
                    {/* Selector opcional: Servicio del catálogo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Servicio del catálogo <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <select
                        value={selectedCatalogIdCita}
                        onChange={(e) => handleSelectCatalogCita(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                      >
                        <option value="">Seleccionar del catálogo o escribir abajo...</option>
                        {activeServicios.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} (${s.total.toFixed(2)} MXN)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Servicio solicitado <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={citaServicio}
                        onChange={(e) => setCitaServicio(e.target.value)}
                        placeholder="Ej. Cambio de balatas y afinación"
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                          step3Errors.citaServicio ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                        }`}
                      />
                      {step3Errors.citaServicio && (
                        <p className="text-xs text-red-600 mt-1">{step3Errors.citaServicio}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Fecha <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={citaFecha}
                          onChange={(e) => setCitaFecha(e.target.value)}
                          className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                            step3Errors.citaFecha ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                          }`}
                        />
                        {step3Errors.citaFecha && (
                          <p className="text-xs text-red-600 mt-1">{step3Errors.citaFecha}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Hora <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={citaHora}
                          onChange={(e) => setCitaHora(e.target.value)}
                          className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                            step3Errors.citaHora ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                          }`}
                        />
                        {step3Errors.citaHora && (
                          <p className="text-xs text-red-600 mt-1">{step3Errors.citaHora}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {tipoAtencion === 'cotizacion' && (
                  <div className="space-y-4">
                    {/* Selector opcional: Servicio del catálogo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Servicio del catálogo <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <select
                        value={selectedCatalogIdCot}
                        onChange={(e) => handleSelectCatalogCot(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                      >
                        <option value="">Seleccionar del catálogo o escribir abajo...</option>
                        {activeServicios.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} (${s.total.toFixed(2)} MXN)
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">
                        Completa automáticamente la descripción, refacciones y mano de obra con los importes base.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descripción del trabajo <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={cotDescripcion}
                        onChange={(e) => setCotDescripcion(e.target.value)}
                        placeholder="Detalle de trabajos y refacciones a presupuestar..."
                        className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                          step3Errors.cotDescripcion ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                        }`}
                      />
                      {step3Errors.cotDescripcion && (
                        <p className="text-xs text-red-600 mt-1">{step3Errors.cotDescripcion}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Importe de refacciones ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cotRefacciones}
                          onChange={(e) => setCotRefacciones(e.target.value)}
                          className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                            step3Errors.cotRefacciones ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                          }`}
                        />
                        {step3Errors.cotRefacciones && (
                          <p className="text-xs text-red-600 mt-1">{step3Errors.cotRefacciones}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Importe de mano de obra ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cotManoObra}
                          onChange={(e) => setCotManoObra(e.target.value)}
                          className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                            step3Errors.cotManoObra ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                          }`}
                        />
                        {step3Errors.cotManoObra && (
                          <p className="text-xs text-red-600 mt-1">{step3Errors.cotManoObra}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#F6F8FA] p-4 rounded-xl border border-[#DDE4E8] flex items-center justify-between">
                      <span className="font-semibold text-[#231F20]">Total estimado:</span>
                      <span className="text-xl font-bold text-[#1D7EAE]">
                        ${cotTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {tipoAtencion === 'orden' && (
                  <div className="space-y-4">
                    {/* Selector opcional: Servicio del catálogo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Servicio del catálogo <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <select
                        value={selectedCatalogIdOrden}
                        onChange={(e) => handleSelectCatalogOrden(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                      >
                        <option value="">Seleccionar del catálogo o escribir abajo...</option>
                        {activeServicios.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} (${s.total.toFixed(2)} MXN)
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">
                        Al seleccionar un servicio activo se completa la descripción del trabajo automáticamente.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Servicio solicitado <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ordenServicio}
                        onChange={(e) => setOrdenServicio(e.target.value)}
                        placeholder="Ej. Revisión de frenos y suspensión"
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                          step3Errors.ordenServicio ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                        }`}
                      />
                      {step3Errors.ordenServicio && (
                        <p className="text-xs text-red-600 mt-1">{step3Errors.ordenServicio}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Kilometraje actual <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ordenKm}
                        onChange={(e) => setOrdenKm(e.target.value)}
                        placeholder="Ej. 65,400 km"
                        className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                          step3Errors.ordenKm ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                        }`}
                      />
                      {step3Errors.ordenKm && (
                        <p className="text-xs text-red-600 mt-1">{step3Errors.ordenKm}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Observaciones de recepción <span className="text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={ordenObservaciones}
                        onChange={(e) => setOrdenObservaciones(e.target.value)}
                        placeholder="Detalles estéticos o notas especiales..."
                        className="w-full px-3.5 py-2 border border-[#DDE4E8] rounded-lg text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PASO 4 */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Paso 4: Revisar y Guardar
                  </h3>
                  <p className="text-sm text-slate-500">
                    Verifica la información antes de crear el registro definitivo.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-xs tracking-wider uppercase mb-2">
                      Cliente y Vehículo
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <p>
                        <span className="font-medium text-slate-500">Cliente:</span>{' '}
                        {isNewClientAndVehicle ? newClientName : clienteMap.get(selectedClientId)?.nombre}
                      </p>
                      <p>
                        <span className="font-medium text-slate-500">Teléfono:</span>{' '}
                        {isNewClientAndVehicle ? newClientPhone : clienteMap.get(selectedClientId)?.telefono}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-medium text-slate-500">Vehículo:</span>{' '}
                        {isNewClientAndVehicle
                          ? `${newVehBrand} ${newVehModel} (${newVehPlates.toUpperCase()})`
                          : (() => {
                              const v = vehiculos.find((item) => item.id === selectedVehiculoId);
                              return v ? `${v.marca} ${v.modelo} (${v.placas})` : '';
                            })()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <h4 className="font-semibold text-slate-800 text-xs tracking-wider uppercase mb-2">
                      Detalles de la solicitud
                    </h4>
                    <div className="space-y-1.5 text-slate-700">
                      <p>
                        <span className="font-medium text-slate-500">Tipo:</span>{' '}
                        <span className="font-semibold capitalize">{tipoAtencion}</span>
                      </p>
                      {tipoAtencion === 'cita' && (
                        <>
                          <p>
                            <span className="font-medium text-slate-500">Servicio:</span> {citaServicio}
                          </p>
                          <p>
                            <span className="font-medium text-slate-500">Fecha y hora:</span> {citaFecha} a las {citaHora}
                          </p>
                        </>
                      )}
                      {tipoAtencion === 'cotizacion' && (
                        <>
                          <p>
                            <span className="font-medium text-slate-500">Descripción:</span> {cotDescripcion}
                          </p>
                          <p>
                            <span className="font-medium text-slate-500">Refacciones:</span> ${parseFloat(cotRefacciones || '0').toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium text-slate-500">Mano de obra:</span> ${parseFloat(cotManoObra || '0').toFixed(2)}
                          </p>
                          <p className="font-bold text-slate-900 pt-1">
                            <span className="font-medium text-slate-500">Total:</span> ${cotTotal.toFixed(2)}
                          </p>
                        </>
                      )}
                      {tipoAtencion === 'orden' && (
                        <>
                          <p>
                            <span className="font-medium text-slate-500">Servicio:</span> {ordenServicio}
                          </p>
                          <p>
                            <span className="font-medium text-slate-500">Kilometraje:</span> {ordenKm}
                          </p>
                          {ordenObservaciones && (
                            <p>
                              <span className="font-medium text-slate-500">Observaciones:</span> {ordenObservaciones}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmAtencion}
                  className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Confirmar atención'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
