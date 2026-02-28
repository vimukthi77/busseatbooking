'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Shield, CreditCard, AlertCircle, Scale, Lock, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const sections = [
    {
      icon: FileText,
      title: t('terms.section1.title'),
      content: t('terms.section1.content'),
      points: [
        t('terms.section1.point1'),
        t('terms.section1.point2'),
        t('terms.section1.point3'),
        t('terms.section1.point4'),
      ]
    },
    {
      icon: CreditCard,
      title: t('terms.section2.title'),
      content: t('terms.section2.content'),
      points: [
        t('terms.section2.point1'),
        t('terms.section2.point2'),
        t('terms.section2.point3'),
        t('terms.section2.point4'),
        t('terms.section2.point5'),
      ]
    },
    {
      icon: AlertCircle,
      title: t('terms.section3.title'),
      content: t('terms.section3.content'),
      points: [
        t('terms.section3.point1'),
        t('terms.section3.point2'),
        t('terms.section3.point3'),
        t('terms.section3.point4'),
      ]
    },
    {
      icon: Shield,
      title: t('terms.section4.title'),
      content: t('terms.section4.content'),
      points: [
        t('terms.section4.point1'),
        t('terms.section4.point2'),
        t('terms.section4.point3'),
        t('terms.section4.point4'),
      ]
    },
    {
      icon: Scale,
      title: t('terms.section5.title'),
      content: t('terms.section5.content'),
      points: [
        t('terms.section5.point1'),
        t('terms.section5.point2'),
        t('terms.section5.point3'),
      ]
    },
    {
      icon: Lock,
      title: t('terms.section6.title'),
      content: t('terms.section6.content'),
      points: [
        t('terms.section6.point1'),
        t('terms.section6.point2'),
        t('terms.section6.point3'),
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 mt-20">      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <Card className="mb-8 border-sky-200 bg-gradient-to-r from-sky-500 to-blue-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-3">{t('terms.mainTitle')}</h1>
                <p className="text-sky-50 text-lg leading-relaxed">
                  {t('terms.mainDescription')}
                </p>
                <p className="text-sky-100 text-sm mt-3">
                  {t('terms.lastUpdated')}: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">{t('terms.importantNotice')}</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  {t('terms.importantNoticeText')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="border-sky-200 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50">
                  <CardTitle className="flex items-center gap-3 text-gray-800">
                    <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {section.content}
                  </p>
                  <ul className="space-y-3">
                    {section.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-2"></div>
                        <span className="text-gray-600 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Section */}
        <Card className="mt-8 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Phone className="w-6 h-6 text-sky-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t('terms.questions')}</h3>
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {t('terms.questionsText')}
                </p>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>{t('terms.email')}:</strong> busseatbooking2@gmail.com</p>
                  <p><strong>{t('terms.phone')}:</strong> +94 724 15 15 15</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => router.push('/')}
            size="lg"
            className="w-full md:w-auto"
          >
            {t('common.backToHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}