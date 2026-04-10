'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bookAppointment } from '@/utils/whatsapp';
import { SERVICES } from '@/utils/constants';
import { AppointmentRequest } from '@/types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedServices.length === 0) {
      alert('Por favor selecciona al menos un servicio.');
      return;
    }

    const appointment: AppointmentRequest = {
      services: selectedServices,
      preferredDate
    };

    bookAppointment(appointment);
    onClose();
    
    // Reset form
    setSelectedServices([]);
    setPreferredDate('');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="modal-content bg-zinc-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-zinc-700"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <div className="modal-header flex justify-between items-center p-6 border-b border-zinc-700">
              <h3 className="text-xl font-bold text-white">AGENDAR CITA</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-pink-500 text-2xl w-8 h-8 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            <div className="modal-body p-6">
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-6">
                  <label className="block text-white font-semibold mb-3">
                    Servicios deseados:
                  </label>
                  <div className="service-checkboxes space-y-3">
                    {SERVICES.map((service) => (
                      <label
                        key={service.id}
                        className="checkbox-item flex items-center cursor-pointer p-3 rounded-lg transition-colors hover:bg-zinc-800"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            name="services"
                            value={service.id}
                            checked={selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="sr-only"
                          />
                          <div 
                            className={`checkmark w-6 h-6 border-2 rounded border-zinc-600 mr-4 flex-shrink-0 transition-colors ${
                              selectedServices.includes(service.id)
                                ? 'bg-pink-500 border-pink-500'
                                : 'bg-zinc-800'
                            }`}
                          />
                        </div>
                        <span 
                          className={`service-name font-medium transition-colors ${
                            selectedServices.includes(service.id) 
                              ? 'text-pink-500' 
                              : 'text-white'
                          }`}
                        >
                          {service.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group mb-6">
                  <label htmlFor="preferred-date" className="block text-white font-semibold mb-3">
                    Fecha preferida:
                  </label>
                  <input
                    type="date"
                    id="preferred-date"
                    name="preferred-date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="w-full p-3 bg-zinc-800 border-2 border-zinc-600 rounded-lg text-white focus:outline-none focus:border-pink-500 transition-colors [color-scheme:dark]"
                  />
                </div>

                <div className="modal-actions flex flex-col gap-3 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary px-6 py-3 border-2 border-zinc-600 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Continuar a WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}