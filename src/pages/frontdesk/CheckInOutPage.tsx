import React from 'react';

const CheckInOutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <h1 className="text-xl font-semibold text-gray-900">Check In / Check Out</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <p className="text-center py-12">Check in/check out placeholder</p>
        </div>
      </main>
    </div>
  );
};

export default CheckInOutPage;
