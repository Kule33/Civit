import React from 'react';
import { useNavigate } from 'react-router-dom';
import cvitLogo from '../assets/cvit.jpg'; // Replace with actual path to CVIT logo
const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-lg shadow-xl p-10 md:p-16 mb-10 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="currentColor" fillOpacity="0.1" d="M0,160L48,160C96,160,192,160,288,176C384,192,480,224,576,224C672,224,768,192,864,170.7C960,149,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <img 
            src={cvitLogo}
            alt="CVIT Logo" 
            className="h-10 mx-auto mb-4" 
          />
          <h2 className="text-5xl font-extrabold mb-4 leading-tight">
            Empower Your Education with Paper Master
          </h2>
          <p className="text-xl font-light mb-8 opacity-90">
            Crafting knowledge, effortlessly. Design, manage, and publish academic papers with unprecedented ease.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/teacher/paper-builder')}
              className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Start Building a Paper →
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')} // Assuming an admin dashboard route
              className="border border-white text-white hover:bg-white hover:text-purple-700 px-8 py-3 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Admin Login →
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white rounded-lg shadow-xl px-6 md:px-12">
        <h3 className="text-4xl font-bold text-center text-gray-800 mb-12">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature Card 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg shadow-md text-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="bg-blue-500/10 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <img src="https://via.placeholder.com/64?text=📝" alt="Paper Builder Icon" className="h-12 w-12"/>
            </div>
            <h4 className="text-2xl font-semibold text-gray-800 mb-3">Intuitive Paper Builder</h4>
            <p className="text-gray-600">
              Create custom question papers with a drag-and-drop interface, saving hours of manual work.
            </p>
          </div>
          {/* Feature Card 2 */}
          <div className="bg-gradient-to-br from-green-50 to-teal-100 p-8 rounded-lg shadow-md text-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="bg-green-500/10 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <img src="https://via.placeholder.com/64?text=📚" alt="Question Bank Icon" className="h-12 w-12"/>
            </div>
            <h4 className="text-2xl font-semibold text-gray-800 mb-3">Extensive Question Bank</h4>
            <p className="text-gray-600">
              Access a vast, categorized library of questions and easily integrate them into your papers.
            </p>
          </div>
          {/* Feature Card 3 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-lg shadow-md text-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="bg-purple-500/10 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <img src="https://via.placeholder.com/64?text=🖨️" alt="Typeset & Publish Icon" className="h-12 w-12"/>
            </div>
            <h4 className="text-2xl font-semibold text-gray-800 mb-3">Professional Typesetting</h4>
            <p className="text-gray-600">
              Generate perfectly formatted, print-ready papers with advanced typesetting features.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section (Optional) */}
      <section className="py-12 bg-white rounded-lg shadow-xl px-6 md:px-12 mt-10 text-center">
        <h3 className="text-3xl font-bold text-gray-800 mb-4">Ready to simplify your paper creation?</h3>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Join hundreds of educators who are transforming their workflow with Paper Master.
        </p>
        <button
          onClick={() => navigate('/teacher/paper-builder')}
          className="bg-blue-600 text-white hover:bg-blue-700 px-10 py-4 rounded-full text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          Get Started Today!
        </button>
      </section>
    </div>
  );
};

export default Home;