'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, useLanguage } from '@/contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';
import { Preloader } from './Preloader';
import Image from 'next/image';

interface LanguageSelectorProps {
  onLanguageSelected: () => void;
}

export default function LanguageSelector({ onLanguageSelected }: LanguageSelectorProps) {
  const { setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredLang, setHoveredLang] = useState<Language | null>(null);

  const languages = [
    {
      code: 'en' as Language,
      name: 'English',
      nativeName: 'English',
      country: 'United States',
      flag: '/usa.webp',
      description: 'Continue in English',
      gradient: 'from-blue-500 to-red-500',
    },
    {
      code: 'si' as Language,
      name: 'Sinhala',
      nativeName: 'සිංහල',
      country: 'Sri Lanka',
      flag: '/srilanka.webp',
      description: 'සිංහලෙන් දිගටම කරගෙන යන්න',
      gradient: 'from-orange-500 to-green-600',
    },
  ];

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang);
    setIsAnimating(true);

    setTimeout(() => {
      setLanguage(lang);
      onLanguageSelected();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-sky-100 flex items-center justify-center p-4 overflow-hidden">
      {/* Simple Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-sky-100" />

      <div className="relative w-full max-w-2xl mx-auto">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-0 md:mb-6 mt-20"
        >

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-sky-700 mb-1"
          >
            Welcome to Bus Seat Booking
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm md:text-base text-gray-600  hidden md:block"
          >
            Choose your preferred language • ඔබගේ භාෂාව තෝරන්න
          </motion.p>
        </motion.div>

        {/* Compact Language Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-10 md:p-0">
          {languages.map((lang, index) => {
            const isSelected = selectedLang === lang.code;
            const isHovered = hoveredLang === lang.code;

            return (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={isAnimating}
                onHoverStart={() => setHoveredLang(lang.code)}
                onHoverEnd={() => setHoveredLang(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative overflow-hidden rounded-sm bg-transparent shadow-lg
                  transition-all duration-300
                  ${isSelected ? 'ring-4 ring-sky-400 shadow-sky-200' : 'hover:shadow-xl'}
                `}
              >

                {/* Card Content */}
                <div className="p-4">
                  {/* Flag Image */}
                  <div className="relative w-full aspect-[2/1] rounded-sm overflow-hidden mb-3 shadow-md">
                    <Image
                      src={lang.flag}
                      alt={`${lang.country} flag`}
                      fill
                      className="object-cover"
                      priority
                    />
                    
                    {/* Country Label */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-semibold drop-shadow">
                        {lang.country}
                      </p>
                    </div>

                    {/* Check Badge */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <div className={`w-6 h-6 bg-gradient-to-br ${lang.gradient} rounded-full flex items-center justify-center`}>
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Language Info */}
                  <div className="text-left space-y-1">
                    <h3 className={`
                      text-xl md:text-2xl font-bold transition-colors
                      ${isSelected ? 'text-sky-600' : 'text-gray-800'}
                    `}>
                      {lang.nativeName}
                    </h3>
                    
                    <p className={`
                      text-xs md:text-sm transition-colors line-clamp-1
                      ${isSelected ? 'text-sky-600' : 'text-gray-600'}
                    `}>
                      {lang.description}
                    </p>

                  </div>
                </div>

                {/* Hover Shine */}
                {isHovered && !isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-gray-500"
        >
          Saved for 24 hours • පැය 24ක් සුරකිනු ඇත
        </motion.p>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-sky-100/90 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <Preloader />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-sky-700 font-medium text-sm"
              >
                Loading...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}