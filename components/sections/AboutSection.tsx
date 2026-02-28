'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  Award, 
  Users, 
  Clock, 
  Star,
  Shield,
  MapPin,
  ArrowRight,
  Play,
  ChevronRight
} from 'lucide-react';
import { motion, Variants, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const AboutSection = () => {
  const { t } = useLanguage();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isSwipeComplete, setIsSwipeComplete] = useState(false);
  const router = useRouter();
  
  const x = useMotionValue(0);
  const scale = useTransform(x, [0, 200], [1, 1.25]);
  const opacity = useTransform(x, [0, 200], [1, 0.8]);
  const backgroundOpacity = useTransform(x, [0, 200], [0, 1]);
  
  const constraintsRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <Award className="w-8 h-8" />,
      title: t('about.experience25Years'),
      description: t('about.experience25YearsDesc'),
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('about.happyCustomers1M'),
      description: t('about.happyCustomers1MDesc'),
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('about.safetyRecord100'),
      description: t('about.safetyRecord100Desc'),
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: t('about.service247'),
      description: t('about.service247Desc'),
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    }
  ];

  const stats = [
    { number: "1M+", label: t('about.happyPassengers') },
    { number: "5+", label: t('about.routesCovered') },
    { number: "200+", label: t('about.modernBuses') },
    { number: "25+", label: t('about.yearsExperience') }
  ];

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 180;
    
    if (info.offset.x > threshold) {
      setIsSwipeComplete(true);
      x.set(200);
      
      setTimeout(() => {
        router.push('/booking');
      }, 300);
    } else {
      x.set(0);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const imageVariants: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const statsVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const statItemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const floatingCardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.5, 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const ctaVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden" id="about">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {t('about.title')}
            <span className="block text-transparent bg-clip-text bg-accent">
              {t('about.since')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          {/* Content Side */}
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-12 bg-primary rounded-full"></div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {t('about.ourStory')}
                </h3>
              </div>
              
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p className="text-lg">
                  {t('about.storyParagraph1')}
                </p>
                <p className="text-lg">
                  {t('about.storyParagraph2')}
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-sidebar rounded-xl border border-blue-100">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('about.islandWideCoverage')}</p>
                  <p className="text-sm text-gray-600">{t('about.coverageDescription')}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Video Side */}
          <motion.div 
            className="relative"
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="relative h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl bg-gray-900">
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onLoadedData={() => setIsVideoLoaded(true)}
                  onError={() => setIsVideoLoaded(false)}
                >
                  <source src="/herovideo.webm" type="video/webm" />
                  <source src="/herovideo.mp4" type="video/mp4" />
                </video>

                {!isVideoLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-medium">{t('common.loading')}</p>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none"></div>
              </div>

              <motion.div
                className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 backdrop-blur-sm"
                variants={floatingCardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">98%</p>
                    <p className="text-xs text-gray-500">{t('about.onTimeRate')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">4.9★</p>
                    <p className="text-xs text-gray-500">{t('about.customerRating')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div 
          className="bg-accent rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden"
          variants={statsVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full"></div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                {t('about.trustedBy')}
              </h3>
              <p className="text-black text-lg">
                {t('about.numbersSpeak')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  variants={statItemVariants}
                  initial="hidden"
                  whileInView="visible"
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-3xl lg:text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-black text-sm lg:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Swipe-to-Book CTA Section */}
        <motion.div 
          className="text-center"
          variants={ctaVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p className="text-sm text-gray-500 mt-4 mb-4">
            {t('about.bookNextTrip')}
          </p>
          <div className="max-w-md mx-auto">
            <div 
              ref={constraintsRef}
              className="relative bg-white rounded-2xl p-2 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <motion.div
                className="absolute inset-2 bg-primary rounded-xl"
                style={{ opacity: backgroundOpacity }}
              />
              
              <div className="relative z-10 flex items-center justify-between px-4 py-3">
                <span className="pl-20 text-gray-600 font-medium text-sm md:text-base">
                  {isSwipeComplete ? t('about.redirecting') : t('about.swipeToStart')}
                </span>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>

              <motion.div
                ref={constraintsRef}
                className="absolute left-2 top-2 bottom-2 w-16 bg-primary rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-20"
                drag="x"
                dragConstraints={{ left: 0, right: 200 }}
                dragElastic={0.1}
                style={{ 
                  x,
                  scale,
                  opacity: isSwipeComplete ? 0.5 : opacity
                }}
                onDragEnd={handleDragEnd}
                whileDrag={{ 
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  cursor: "grabbing"
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: isSwipeComplete ? 360 : 0,
                    scale: isSwipeComplete ? 0.8 : 1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <ArrowRight className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>

              {isSwipeComplete && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center z-30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-white font-semibold flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <CheckCircle className="w-6 h-6" />
                    </motion.div>
                    <span>{t('common.success')}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;