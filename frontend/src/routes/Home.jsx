import React, { useState, useEffect } from 'react';
import { FileText, Database, Users, BookOpen, Award, CheckCircle, GraduationCap, PenTool, Calculator, Clock, Target, Search, Upload, MessageCircle, CreditCard, Filter, Camera, Globe, Zap, Edit3 } from 'lucide-react';

const Home = () => {
  const handleNavigation = (path) => {
    console.log('Navigate to:', path);
    // Navigation logic would be handled by your router
  };

  const features = [
    {
      icon: Search,
      title: 'Smart Question Search',
      description: 'Browse through extensive image-based question bank with advanced filtering by subject, year, and exam type.',
      color: 'bg-blue-500'
    },
    {
      icon: Edit3,
      title: 'Paper Builder',
      description: 'Drag-and-drop interface to create custom question papers with comments and annotations.',
      color: 'bg-green-500'
    },
    {
      icon: Upload,
      title: 'Custom Questions',
      description: 'Upload your own questions to expand the shared question bank for all teachers.',
      color: 'bg-purple-500'
    },
    {
      icon: MessageCircle,
      title: 'JV Graphics Integration',
      description: 'Direct WhatsApp communication with professional typesetters for final document preparation.',
      color: 'bg-orange-500'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Question Bank', icon: Database },
    { number: '1,000+', label: 'Teachers', icon: Users },
    { number: '15K+', label: 'Papers Created', icon: FileText },
    { number: '4.8/5', label: 'User Rating', icon: Award }
  ];

  const workflow = [
    {
      step: 1,
      title: 'Filter & Search',
      description: 'Select subject, exam type, and filter by year or school to find relevant questions',
      icon: Filter
    },
    {
      step: 2,
      title: 'Build Paper',
      description: 'Select questions, add comments, and arrange them using our intuitive paper builder',
      icon: Edit3
    },
    {
      step: 3,
      title: 'Preview & Pay',
      description: 'Review your paper, make final edits, and complete payment for typesetting service',
      icon: CreditCard
    },
    {
      step: 4,
      title: 'Get Professional PDF',
      description: 'Receive professionally typeset documents via WhatsApp from JV Graphics team',
      icon: MessageCircle
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* JV Graphics Themed 3D Background */}
      <div className="absolute inset-0 opacity-8">
        {/* Typesetting desks */}
        <div className="absolute top-20 left-1/4 w-20 h-12 bg-gradient-to-br from-amber-300 to-amber-400 rounded shadow-lg transform rotate-6">
          <div className="w-full h-full bg-gradient-to-t from-amber-400 to-amber-200 rounded"></div>
        </div>
        <div className="absolute top-32 right-1/4 w-20 h-12 bg-gradient-to-br from-amber-300 to-amber-400 rounded shadow-lg transform -rotate-8">
          <div className="w-full h-full bg-gradient-to-t from-amber-400 to-amber-200 rounded"></div>
        </div>
        
        {/* Design tools - Pens and Pencils */}
        <div className="absolute top-28 left-1/3 w-1 h-14 bg-blue-600 rounded-full shadow transform rotate-45"></div>
        <div className="absolute top-38 right-1/3 w-1 h-14 bg-red-600 rounded-full shadow transform -rotate-30"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-16 bg-yellow-500 rounded-full shadow transform rotate-60">
          <div className="w-full h-2 bg-pink-400 rounded-full mt-14"></div>
        </div>
        
        {/* Question papers */}
        <div className="absolute top-16 right-16 w-12 h-16 bg-white shadow-md transform rotate-12 rounded border">
          <div className="p-1 space-y-0.5">
            <div className="h-0.5 bg-gray-300 w-3/4"></div>
            <div className="h-0.5 bg-gray-300 w-1/2"></div>
            <div className="h-0.5 bg-gray-300 w-4/5"></div>
          </div>
        </div>
        <div className="absolute bottom-20 right-20 w-12 h-16 bg-white shadow-md transform -rotate-8 rounded border">
          <div className="p-1 space-y-0.5">
            <div className="h-0.5 bg-blue-300 w-full"></div>
            <div className="h-0.5 bg-blue-300 w-2/3"></div>
            <div className="h-0.5 bg-blue-300 w-4/5"></div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-xl mb-6">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-4">
              Paper Master
            </h1>
            <p className="text-2xl text-blue-600 font-semibold mb-2">
              by CVIT SOLUTIONS
            </p>
            <p className="text-xl text-gray-600">
              Professional Question Paper Creation & Typesetting Platform
            </p>
          </div>

          {/* Description */}
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              Create professional exam papers from our extensive image-based question bank. 
              Filter by subject, year, and exam type, then get professionally typeset documents 
              delivered via WhatsApp by our expert design team.
            </p>
          </div>

          {/* User Role Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <button
              onClick={() => handleNavigation('/teacher/login')}
              className="group px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <GraduationCap size={24} />
                <div className="text-left">
                  <div>I'm a Teacher</div>
                  <div className="text-sm font-normal opacity-90">Create Question Papers</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleNavigation('/admin/login')}
              className="group px-10 py-5 border-2 border-blue-600 text-blue-600 rounded-2xl font-bold text-lg hover:bg-blue-600 hover:text-white transition-all"
            >
              <div className="flex items-center space-x-3">
                <Database size={24} />
                <div className="text-left">
                  <div>CVIT Admin</div>
                  <div className="text-sm font-normal opacity-75">Manage Question Bank</div>
                </div>
              </div>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Question Paper Solution
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From question selection to professional typesetting, we handle every step of your exam paper creation process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-all hover:scale-105">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple 4-step process to create professional question papers</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-4 w-8 h-0.5 bg-blue-200"></div>
                )}
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  {step.step}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Flexible Pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that works for you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 border-2 border-gray-200 rounded-2xl">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Tier</h3>
                <div className="text-4xl font-bold text-green-600 mb-6">Free</div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Up to 50 questions per paper</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Access to question bank</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Basic paper builder</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Upload custom questions</span>
                  </li>
                </ul>
                <button className="w-full py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors">
                  Get Started Free
                </button>
              </div>
            </div>

            <div className="p-8 bg-blue-600 text-white rounded-2xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Professional</h3>
                <div className="text-4xl font-bold mb-6">Pay per Use</div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-200" />
                    <span>Unlimited questions</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-200" />
                    <span>Professional typesetting via JV Graphics</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-200" />
                    <span>WhatsApp delivery</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-200" />
                    <span>PayHere secure payments</span>
                  </li>
                </ul>
                <button className="w-full py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Start Creating
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JV Graphics Partnership */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <PenTool className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Powered by CVIT SOLUTIONS</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Professional design and typesetting services ensure your question papers meet the highest academic standards
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <Award className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Expert Typesetters</h3>
              <p className="text-blue-200">Professional design team with years of academic publishing experience</p>
            </div>
            <div className="text-center">
              <Clock className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Quick Turnaround</h3>
              <p className="text-blue-200">Receive your professionally formatted papers within 24-48 hours</p>
            </div>
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Direct Communication</h3>
              <p className="text-blue-200">WhatsApp integration for seamless communication and file delivery</p>
            </div>
          </div>

          <div className="mt-16">
            <button
              onClick={() => handleNavigation('/teacher/register')}
              className="px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl"
            >
              Start Your First Paper Today
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;