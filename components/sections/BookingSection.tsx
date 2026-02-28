'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BookingSection = () => {
  const { t } = useLanguage();
  const [bookingData, setBookingData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: '1'
  });

  const popularRoutes = [
    { from: 'Colombo', to: 'Kaduruwela' },
    { from: 'Colombo', to: 'Trincomalee' }
  ];

  return (
    <section className="booking-section">
      <div className="accent-line"></div>
      <div className="particles"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-8 text-accent">
              {t('booking.bookYourBusTicket')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
                <Input
                  placeholder={t('booking.from')}
                  value={bookingData.from}
                  onChange={(e) => setBookingData({ ...bookingData, from: e.target.value })}
                  className="pl-10 h-12 bg-white/90 border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="relative">
                <ArrowLeftRight className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
                <Input
                  placeholder={t('booking.to')}
                  value={bookingData.to}
                  onChange={(e) => setBookingData({ ...bookingData, to: e.target.value })}
                  className="pl-10 h-12 bg-white/90 border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
                <Input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  className="pl-10 h-12 bg-white/90 border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
                <select
                  value={bookingData.passengers}
                  onChange={(e) => setBookingData({ ...bookingData, passengers: e.target.value })}
                  className="w-full h-12 pl-10 pr-4 bg-white/90 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num} {num > 1 ? t('booking.passengers_plural') : t('booking.passenger')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
              {t('booking.searchBuses')}
            </Button>

            <div className="mt-8">
              <p className="text-sm text-gray-600 mb-4 font-medium">{t('booking.popularRoutes')}:</p>
              <div className="flex flex-wrap gap-2">
                {popularRoutes.map((route, index) => (
                  <button
                    key={index}
                    onClick={() => setBookingData({ ...bookingData, from: route.from, to: route.to })}
                    className="px-4 py-2 bg-gray-100/80 hover:bg-primary/10 hover:border-primary border border-gray-200 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    {route.from} → {route.to}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;