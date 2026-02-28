'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, User, LogOut, Settings, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Scroll states
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [lastScrollY, setLastScrollY] = useState(0);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '/usa.webp',
      country: 'United States',
    },
    {
      code: 'si',
      name: 'Sinhala',
      nativeName: 'සිංහල',
      flag: '/srilanka.webp',
      country: 'Sri Lanka',
    },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  const otherLanguage = languages.find(lang => lang.code !== language) || languages[1];

  // Handle scroll for header visibility and opacity
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
        setOpacity(0);
      } else {
        // Scrolling up
        setIsVisible(true);
        setOpacity(1);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'si' : 'en';
    setLanguage(newLanguage);
  };

  const navItems = [
    { name: t('header.home'), href: '/' },
    { name: t('header.routes'), href: '#routes' },
    { name: t('header.about'), href: '#about' },
    { name: t('header.services'), href: '#services' },
    { name: t('header.contact'), href: '#contact' },
  ];

  return (
    <header 
      className={`sticky top-5 h-0 z-50 transition-all duration-700 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-32'
      }`}
      style={{ 
        opacity: opacity,
        transition: 'opacity 0.7s ease-in-out, transform 0.7s ease-in-out'
      }}
    >
      {/* Main header */}
      <div className={`container mx-auto px-4 transition-all duration-500 ease-in-out bg-transparent `}>
        <div className="flex justify-between items-center h-full ">
          {/* Logo */}
          <Link href="/" className="flex group w-32">
                  <DotLottieReact
              src="https://lottie.host/b8463921-449f-46c0-8c05-0d41f96dfb66/3Rz3QkM4MI.lottie"
                    loop
                    autoplay
                  />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center space-x-8 bg-white px-5 py-2 gap-6 rounded-full backdrop-blur-lg border border-black/20">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-medium transition-all duration-300 ease-in-out relative group `}
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Language Switcher - Simple Click to Toggle */}
            <button
              onClick={toggleLanguage}
              className="group relative flex items-center space-x-2 bg-sky-400/10 backdrop-blur-sm hover:bg-white rounded-full px-3 md:px-4 py-2 transition-all duration-300 shadow-sm hover:shadow-md"
              title={`Switch to ${otherLanguage.nativeName}`}
            >
              {/* Current Flag */}
              <div className="relative w-8 h-4 md:w-10 md:h-5 overflow-hidden flex-shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <Image
                  src={currentLanguage.flag}
                  alt={`${currentLanguage.country} flag`}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>

              {/* Swap Icon */}
              <ArrowLeftRight className="w-5 h-5 text-sky-400 group-hover:text-primary transition-colors group-hover:scale-110 transform duration-200" />

              {/* Next Flag (Small Preview) */}
              <div className="relative w-8 h-4 md:w-10 md:h-5 overflow-hidden flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                <Image
                  src={otherLanguage.flag}
                  alt={`${otherLanguage.country} flag`}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              </div>

              {/* Tooltip on Hover */}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Switch to {otherLanguage.nativeName}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </button>

            {isAuthenticated() ? (
              /* User Menu */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 md:px-4 py-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-gray-800">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                          <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full capitalize mt-1">
                            {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href={
                          user?.role === 'admin' ? '/dashboard/admin' :
                          user?.role === 'manager' ? '/dashboard/manager' :
                          user?.role === 'super_admin' ? '/dashboard/super-admin' :
                          '/dashboard/user'
                        }
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2 bg-red-600 text-white hover:bg-red-500/30 hover:text-red-600 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Register Buttons */
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <Button className="border-primary text-white hover:bg-primary hover:text-white rounded-full px-10 py-5 cursor-pointer">
                    SIGNUP
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className={`lg:hidden p-2 rounded-full text-black bg-sky-700 transition-all duration-300 ease-in-out hover:bg-primary `}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="relative">
                <Menu className={`transition-all text-white duration-300 ease-in-out ${
                  isMenuOpen ? 'opacity-0 rotate-45 scale-0' : 'opacity-100 rotate-0 scale-100'
                }`} />
                <X className={`absolute top-0 left-0 text-white transition-all duration-300 ease-in-out ${
                  isMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-0'
                } `} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 p-4 border-t border-gray-200 bg-white rounded-lg">
            <div className="flex flex-col space-y-3 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary font-medium transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Buttons */}
              {!isAuthenticated() && (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                      Login
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile User Menu */}
              {isAuthenticated() && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={
                        user?.role === 'admin' ? '/dashboard/admin' :
                        user?.role === 'manager' ? '/dashboard/manager' :
                        user?.role === 'super_admin' ? '/dashboard/super-admin' :
                        '/dashboard/user'
                      }
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full justify-start text-black">
                        <Settings className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full justify-start bg-red-700 text-white border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;