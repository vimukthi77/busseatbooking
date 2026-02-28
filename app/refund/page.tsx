'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Calendar, XCircle, CheckCircle, AlertTriangle, Phone, Clock, Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RefundPage() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 mt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <Card className="mb-8 border-orange-200 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-3">{t('refund.mainTitle')}</h1>
                <p className="text-orange-50 text-lg leading-relaxed">
                  {t('refund.mainDescription')}
                </p>
                <p className="text-orange-100 text-sm mt-3">
                  {t('refund.lastUpdated')}: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice - No Cash Refunds */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Ban className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-900 mb-2 text-xl">{t('refund.noCashRefunds')}</h3>
                <p className="text-red-800 leading-relaxed">
                  {t('refund.noCashRefundsText')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rescheduling Policy */}
        <Card className="mb-8 border-green-200 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span>{t('refund.reschedulePolicy')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 mb-6 leading-relaxed">
              {t('refund.reschedulePolicyDesc')}
            </p>

            {/* What You Can Do */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <h4 className="font-bold text-green-900 text-lg">{t('refund.whatYouCanDo')}</h4>
              </div>
              <ul className="space-y-3 ml-9">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0 mt-2"></div>
                  <span className="text-gray-700 leading-relaxed">{t('refund.canDo1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0 mt-2"></div>
                  <span className="text-gray-700 leading-relaxed">{t('refund.canDo2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0 mt-2"></div>
                  <span className="text-gray-700 leading-relaxed">{t('refund.canDo3')}</span>
                </li>
              </ul>
            </div>

            {/* Important Timeline */}
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <h4 className="font-bold text-blue-900 text-lg">{t('refund.importantTimeline')}</h4>
              </div>
              <div className="ml-9 space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-600 text-white">
                    {t('refund.within7Days')}
                  </Badge>
                  <span className="text-gray-700 leading-relaxed flex-1">
                    {t('refund.within7DaysDesc')}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-red-600 text-white">
                    {t('refund.after7Days')}
                  </Badge>
                  <span className="text-gray-700 leading-relaxed flex-1">
                    {t('refund.after7DaysDesc')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Request Rescheduling */}
        <Card className="mb-8 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50">
            <CardTitle className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <span>{t('refund.howToRequest')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 mb-4 leading-relaxed">
              {t('refund.howToRequestDesc')}
            </p>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800 mb-1">{t('refund.step1Title')}</h5>
                  <p className="text-gray-600 text-sm">{t('refund.step1Desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800 mb-1">{t('refund.step2Title')}</h5>
                  <p className="text-gray-600 text-sm">{t('refund.step2Desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800 mb-1">{t('refund.step3Title')}</h5>
                  <p className="text-gray-600 text-sm">{t('refund.step3Desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800 mb-1">{t('refund.step4Title')}</h5>
                  <p className="text-gray-600 text-sm">{t('refund.step4Desc')}</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-800">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <span>{t('refund.importantNotes')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-relaxed">{t('refund.note1')}</p>
            </div>
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-relaxed">{t('refund.note2')}</p>
            </div>
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-relaxed">{t('refund.note3')}</p>
            </div>
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-relaxed">{t('refund.note4')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mt-8 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Phone className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t('refund.needHelp')}</h3>
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {t('refund.needHelpText')}
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>{t('refund.email')}:</strong> busseatbooking2@gmail.com</p>
                  <p><strong>{t('refund.phone')}:</strong> +94 724 15 15 15</p>
                  <p><strong>{t('refund.hours')}:</strong> {t('refund.hoursText')}</p>
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