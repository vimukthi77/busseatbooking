'use client'
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

const ContactSection = () => {
  const { t } = useLanguage();
  return (
    <section className="py-16 lg:py-24 bg-white " id="contact">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-accent mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-3xl font-bold text-gray-800 mb-8">
            {t('contact.contactInformation')}
            </h3>
            
            <div className="space-y-6">

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                <h4 className="font-semibold text-gray-800 mb-1">{t('contact.phoneNumbers')}</h4>
                <p className="text-gray-600">
                {t('contact.hotline')}: +94 72 4151 515
                </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 primary" />
                </div>
                <div>
                <h4 className="font-semibold text-gray-800 mb-1">{t('contact.email')}</h4>
                <p className="text-gray-600">
                busseatbooking2@gmail.com
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;