import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Heart, Sparkles, Globe, Mail, Phone, MapPin, Github, Twitter, Linkedin, ExternalLink } from 'lucide-react';

const Footer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isHovered) {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered]);

  const toggleFooter = () => {
    setIsExpanded(!isExpanded);
  };

  const socialLinks = [
    { name: 'Github', icon: Github, href: '#', color: 'hover:text-gray-800' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-blue-600' },
  ];

  const quickLinks = [
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Support Center', href: '#' },
    { name: 'Community', href: '#' },
  ];

  return (
    <>
      <footer 
        className={`relative overflow-hidden transition-all duration-700 ${isExpanded ? 'pb-8' : 'pb-4'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Dynamic background with mouse tracking */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/40"></div>
        <div 
          className="absolute inset-0 opacity-30 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
          }}
        ></div>
        
        {/* Animated mesh background */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)
              `,
              animation: 'meshFloat 10s ease-in-out infinite'
            }}
          ></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Enhanced toggle button */}
        <div 
          className="relative z-10 flex items-center justify-center py-4 cursor-pointer group"
          onClick={toggleFooter}
        >
          <div className="relative px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-blue-200/50 shadow-lg hover:bg-white/80 hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative flex items-center space-x-3">
              {isExpanded ? (
                <ChevronDown size={18} className="text-blue-600 transition-transform duration-500 group-hover:scale-125" />
              ) : (
                <ChevronUp size={18} className="text-blue-600 transition-transform duration-500 group-hover:scale-125" />
              )}
              <span className="text-sm text-blue-700 font-bold">
                {isExpanded ? 'Show Less' : 'About Us'}
              </span>
              <Sparkles size={16} className="text-blue-500 animate-pulse" />
            </div>
            
            {/* Ripple effect */}
            <div className="absolute inset-0 bg-blue-400/20 rounded-2xl scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-50 transition-all duration-700 animate-ping"></div>
          </div>
        </div>

        {/* Main footer content */}
        <div className="relative z-10 px-6 pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
                <p className="text-sm text-gray-700 font-semibold flex items-center space-x-2">
                  <span>© 2025 Paper Master. All rights reserved.</span>
                  <Heart size={16} className="text-red-500 animate-pulse" />
                </p>
              </div>
              
              <div className="flex items-center space-x-6">
                {['Privacy Policy', 'Terms of Service', 'Contact'].map((link, index) => (
                  <a
                    key={link}
                    href="#"
                    className="relative text-sm text-gray-600 hover:text-blue-600 transition-all duration-300 font-medium group"
                  >
                    {link}
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-500"></div>
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 blur-sm group-hover:w-full transition-all duration-500"></div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded content with enhanced design */}
        <div className={`relative z-10 px-6 transition-all duration-700 ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="max-w-7xl mx-auto pt-6 border-t border-gray-200/50">
            
            {/* CVIT Brand Section */}
            <div className="relative mb-8 p-8 rounded-3xl bg-gradient-to-br from-white/80 to-blue-50/60 backdrop-blur-xl border border-blue-100/60 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-purple-50/40 rounded-3xl"></div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl animate-pulse"></div>
              
              <div className="relative text-center space-y-6">
                <div className="flex items-center justify-center space-x-3 text-lg text-gray-700 mb-4">
                  <span className="font-bold">Built with</span>
                  <Heart size={20} className="text-red-500 fill-current animate-bounce" />
                  <span className="font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                    by the CVIT SOLUTIONS
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                    CVIT - Creating Value Through Innovative Technology
                  </h3>
                  
                  <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Specializing in educational technology solutions that transform learning experiences 
                    and empower educators worldwide through cutting-edge innovation and design.
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-6 pt-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Globe size={16} className="text-blue-600" />
                      <span className="text-sm">Global Reach</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail size={16} className="text-green-600" />
                      <span className="text-sm">24/7 Support</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Sparkles size={16} className="text-purple-600" />
                      <span className="text-sm">Innovation First</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Links and Social Section */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Quick Links */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 text-lg">Quick Links</h4>
                <div className="space-y-2">
                  {quickLinks.map((link, index) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-300 group"
                    >
                      <ExternalLink size={14} className="group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-sm">{link.name}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 text-lg">Contact Us</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Mail size={16} className="text-blue-600" />
                    <span className="text-sm">papermaster.jv@gmail.com</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Phone size={16} className="text-green-600" />
                    <span className="text-sm">+94 78 839 5560</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <MapPin size={16} className="text-red-600" />
                    <span className="text-sm">CVIT SOLUTIONS</span>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 text-lg">Follow Us</h4>
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={social.name}
                      href={social.href}
                      className={`p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/60 hover:bg-white/80 hover:shadow-lg transition-all duration-300 hover:scale-110 ${social.color} group`}
                    >
                      <social.icon size={20} className="group-hover:scale-125 transition-transform duration-300" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <a 
                href="#" 
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-500 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
              >
                <span>Visit Our Website</span>
                <ExternalLink size={18} className="group-hover:rotate-45 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>

        {/* Additional Footer Info - Newsletter Section */}
        <div className={`relative z-10 px-6 transition-all duration-700 ${isExpanded ? 'max-h-40 opacity-100 mt-6' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100/50">
              <div className="text-center space-y-4">
                <h4 className="font-bold text-gray-800 text-lg">Stay Updated</h4>
                <p className="text-gray-600 text-sm">Get the latest updates on new features and educational resources.</p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                  <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes meshFloat {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.3; 
          }
          33% { 
            transform: scale(1.05) rotate(2deg); 
            opacity: 0.5; 
          }
          66% { 
            transform: scale(0.95) rotate(-2deg); 
            opacity: 0.4; 
          }
        }
      `}</style>
    </>
  );
};

export default Footer;