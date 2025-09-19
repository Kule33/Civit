import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Database, Printer, Users, Zap, ArrowRight, Play, CheckCircle, BookOpen, Award, Sparkles, Globe } from 'lucide-react';
// import cvitLogo from '../assets/cvit.jpg'; // Uncomment when you have the logo

const Home = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    // Throttled mouse tracking for better performance
    let ticking = false;
    const throttledMouseMove = (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    window.addEventListener('mousemove', throttledMouseMove);
    document.querySelectorAll('[id^="section-"]').forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'Intuitive Paper Builder',
      description: 'Create custom question papers with a drag-and-drop interface, saving hours of manual work.',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Database,
      title: 'Extensive Question Bank',
      description: 'Access a vast, categorized library of questions and easily integrate them into your papers.',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      icon: Printer,
      title: 'Professional Typesetting',
      description: 'Generate perfectly formatted, print-ready papers with advanced typesetting features.',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Users,
      title: 'Collaborative Platform',
      description: 'Work together with your team to create and review papers in real-time.',
      color: 'from-orange-500 to-red-600'
    },
    {
      icon: Zap,
      title: 'AI-Powered Suggestions',
      description: 'Get intelligent recommendations for questions based on curriculum and difficulty.',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'Built-in plagiarism detection and quality checks ensure academic integrity.',
      color: 'from-amber-500 to-yellow-600'
    }
  ];

  const stats = [
    { icon: Users, number: '10,000+', label: 'Active Educators' },
    { icon: FileText, number: '500K+', label: 'Papers Created' },
    { icon: Globe, number: '4.9/5', label: 'User Rating' },
    { icon: CheckCircle, number: '50+', label: 'Countries' }
  ];

  return (
    <div className="relative min-h-screen">
      {/* Simplified background with mouse tracking */}
      <div 
        className="fixed inset-0 transition-all duration-700 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(59, 130, 246, 0.15) 0%, 
            transparent 50%)`
        }}
      />

      {/* Reduced floating shapes for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute opacity-5 ${
              i % 3 === 0 ? 'bg-blue-400' : 
              i % 3 === 1 ? 'bg-purple-400' : 'bg-emerald-400'
            } rounded-full blur-2xl`}
            style={{
              width: `${120 + Math.random() * 100}px`,
              height: `${120 + Math.random() * 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${20 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section 
        id="section-hero"
        className={`relative min-h-screen flex items-center justify-center px-6 transition-all duration-700 ${isVisible['section-hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
      >
        {/* Simplified hero background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/70 via-purple-600/60 to-pink-600/70"></div>
        </div>

        {/* Reduced particles for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto text-center text-white">
          {/* Logo section */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="text-white w-10 h-10" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400/30 to-purple-400/30 rounded-3xl opacity-50 blur-xl animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-purple-100 bg-clip-text text-transparent">
              Empower Your Education
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent">
              with Paper Master
            </span>
          </h1>

          <p className="text-xl font-light mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Crafting knowledge, effortlessly. Design, manage, and publish academic papers with unprecedented ease.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <button
              onClick={() => navigate('/teacher/paper-builder')}
              className="group relative px-8 py-4 bg-white text-purple-700 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <Play size={20} />
                <span>Start Building a Paper</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/questions/upload')}
              className="group relative px-8 py-4 border-2 border-white text-white rounded-2xl text-lg font-bold hover:bg-white hover:text-purple-700 transition-all duration-300 hover:scale-105 backdrop-blur-xl"
            >
              <div className="flex items-center space-x-3">
                <Database size={20} />
                <span>Admin Portal</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon size={24} className="text-cyan-300" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-cyan-100">{stat.number}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="section-features"
        className={`py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50/30 transition-all duration-700 delay-200 ${isVisible['section-features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to create, manage, and deliver exceptional educational assessments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 bg-white/80 backdrop-blur-sm border border-white/60"
              >
                {/* Icon */}
                <div className={`relative inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={28} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight size={18} className="text-purple-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        id="section-cta"
        className={`py-20 px-6 transition-all duration-700 delay-400 ${isVisible['section-cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl text-center text-white overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-6">
                Ready to Transform Your Paper Creation?
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Join thousands of educators revolutionizing their assessment workflow with Paper Master.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                <button
                  onClick={() => navigate('/teacher/paper-builder')}
                  className="group px-8 py-4 bg-white text-purple-700 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Zap size={20} />
                    <span>Get Started Today!</span>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/teacher/dashboard')}
                  className="group px-8 py-4 border-2 border-white text-white rounded-2xl text-lg font-bold hover:bg-white hover:text-purple-700 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <BookOpen size={20} />
                    <span>View Dashboard</span>
                  </div>
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-white/90 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} />
                  <span>Free to Start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simplified CSS Animations for better performance */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) scale(1); 
            opacity: 0.05; 
          }
          50% { 
            transform: translateY(-20px) scale(1.05); 
            opacity: 0.1; 
          }
        }
      `}</style>
    </div>
  );
};

export default Home;