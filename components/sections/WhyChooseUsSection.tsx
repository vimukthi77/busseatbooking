'use client'
import { Shield, Clock, DollarSign, Headphones, Award, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const WhyChooseUsSection = () => {
  const { t } = useLanguage();
  const reasons = [
    {
      icon: <Shield className="w-12 h-12 text-primary" />,
      title: t('whyChooseUs.safetyFirst'),
      description: t('whyChooseUs.safetyFirstDesc')
    },
    {
      icon: <Clock className="w-12 h-12 text-primary" />,
      title: t('whyChooseUs.onTimeGuarantee'),
      description: t('whyChooseUs.onTimeGuaranteeDesc')
    },
    {
      icon: <DollarSign className="w-12 h-12 text-primary" />,
      title: t('whyChooseUs.bestPrices'),
      description: t('whyChooseUs.bestPricesDesc')
    },
    {
      icon: <Headphones className="w-12 h-12 text-primary" />,
      title: t('whyChooseUs.support247'),
      description: t('whyChooseUs.support247Desc')
    },
    {
      icon: <Award className="w-12 h-12 text-primary" />,
      title: t('whyChooseUs.awardWinning'),
      description: t('whyChooseUs.awardWinningDesc')
    },
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: t('whyChooseUs.trustedByMillions'),
      description: t('whyChooseUs.trustedByMillionsDesc')
    }
  ];

  return (
    <section className="py-10 bg-white px-1 md:px-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-accent mb-4">
            {t('whyChooseUs.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('whyChooseUs.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div 
              key={index}
              className="group text-center p-8 rounded-2xl image-bg hover:bg-gray-50 transition-all duration-300"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-blue-50 rounded-2xl group-hover:bg-blue-100 transition-colors">
                  {reason.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {reason.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-accent rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              {t('whyChooseUs.readyToExperience')}
            </h3>
            <p className="text-lg mb-6 opacity-90">
              {t('whyChooseUs.readyToExperienceDesc')}
            </p>
            <div className="flex flex-col  sm:flex-row gap-4 justify-center">
              <button className="bg-primary hover:scale-105 text-white rounded-full px-8 py-3 font-semibold transition-colors cursor-pointer">
                {t('whyChooseUs.bookYourTrip')}
              </button>
              <button className="border hover:scale-105 border-primary text-primary rounded-full bg-white hover:text-primary px-8 py-3 font-semibold transition-colors cursor-pointer">
                {t('whyChooseUs.contactUs')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;