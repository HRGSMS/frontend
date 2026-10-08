import React from 'react';
import { useParams } from 'react-router-dom';

const ReservationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <h1 className="text-xl font-semibold text-gray-900">Reservation Details</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-center py-12">Reservation details for ID: {id}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReservationDetailPage;
