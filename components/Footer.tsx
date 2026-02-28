'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Phone, Mail, MapPin, Clock, Heart, Send, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const Footer = () => {
  const footerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, []);

  return (
    <footer ref={footerRef} className="bg-gradient-to-br from-gray-50 via-white to-gray-100 text-black relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        
        {/* Main Footer Content */}
        <div className="py-12 md:py-16 lg:py-20">
          
          {/* Top Section - Brand */}
          <div className={`text-center mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 md:mb-6 tracking-tight">
              Bus Seat Booking
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"></div>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 font-medium">
              Sri Lanka's most trusted bus service provider, connecting cities with comfort, safety, and reliability since 1995
            </p>
          </div>

          {/* Middle Section - Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 mb-12 md:mb-16 max-w-5xl mx-auto">
            
            {/* Quick Links */}
            <div className={`bg-white/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 relative inline-block">
                Quick Links
                <span className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
              </h3>
              <ul className="space-y-3 md:space-y-4">
                {['Home', 'About Us', 'Our Fleet', 'Book Now', 'Contact'].map((item, index) => (
                  <li key={index} className="transform transition-all duration-300 hover:translate-x-2">
                    <Link 
                      href={`/${item.toLowerCase().replace(' ', '-')}`}
                      className="text-gray-700 hover:text-primary transition-all duration-300 flex items-center group text-sm sm:text-base font-medium"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center mr-3 transition-all duration-300">
                        <ArrowRight className="w-4 h-4 text-primary transform group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                      <span className="relative">
                        {item}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Information */}
            <div className={`bg-white/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} delay-200`}>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 relative inline-block">
                Contact Us
                <span className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
              </h3>
              <div className="space-y-5 md:space-y-6">
                <a 
                  href="tel:+94724151515" 
                  className="flex items-start space-x-4 group hover:scale-105 transition-all duration-300 p-3 rounded-xl hover:bg-primary/5"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300 flex-shrink-0 shadow-md">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Phone</p>
                    <p className="text-gray-900 font-bold text-sm sm:text-base md:text-lg group-hover:text-primary transition-colors duration-300">
                      +94 72 4151 515
                    </p>
                  </div>
                </a>

                <a 
                  href="mailto:busseatbooking2@gmail.com" 
                  className="flex items-start space-x-4 group hover:scale-105 transition-all duration-300 p-3 rounded-xl hover:bg-primary/5"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300 flex-shrink-0 shadow-md">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Email</p>
                    <p className="text-gray-900 font-bold text-xs sm:text-sm md:text-base break-all group-hover:text-primary transition-colors duration-300">
                      busseatbooking2@gmail.com
                    </p>
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200/80 bg-white/30 backdrop-blur-sm">
          <div className="py-6 md:py-8">
            <div className={`flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              
              {/* Copyright */}
              <p className="text-gray-600 text-xs sm:text-sm md:text-base text-center md:text-left font-medium">
                © 2025 Wijitha Travels. All rights reserved.
              </p>

              {/* Links */}
              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm md:text-base">
                <Link 
                  href="/privacy" 
                  className="text-gray-600 hover:text-primary transition-all duration-300 relative group font-medium px-2 py-1"
                >
                  Privacy Policy
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300 rounded-full"></span>
                </Link>
                <span className="text-gray-400 text-xs">•</span>
                <Link 
                  href="/terms" 
                  className="text-gray-600 hover:text-primary transition-all duration-300 relative group font-medium px-2 py-1"
                >
                  Terms of Service
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300 rounded-full"></span>
                </Link>
                <span className="text-gray-400 text-xs">•</span>
                <Link 
                  href="/refund" 
                  className="text-gray-600 hover:text-primary transition-all duration-300 relative group font-medium px-2 py-1"
                >
                  Refund Policy
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300 rounded-full"></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Credit Section with Gradient Background */}
      <div className={`relative overflow-hidden transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-sky-500 animate-gradient"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 md:py-8">
          <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center flex-wrap gap-2 font-bold drop-shadow-lg">
            <span className="text-white/90">Crafted with</span>
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white animate-pulse drop-shadow-lg" />
            <span className="text-white/90">by</span>
            <a 
              href="https://trimids.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white font-extrabold hover:scale-110 transition-all duration-300 relative group px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 shadow-lg"
            >
              Trimids (Pvt) Ltd
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;