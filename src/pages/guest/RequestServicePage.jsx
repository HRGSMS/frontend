import { useEffect, useState } from 'react';
import api from '../../api/client';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(Number(value));

const RequestServicePage = () => {
  const [services, setServices] = useState([]);
  const [bookingOptions, setBookingOptions] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBookingRoom, setSelectedBookingRoom] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        setError('');

        const [servicesResponse, optionsResponse] = await Promise.all([
          api.get('/service-catalogue'),
          api.get('/service-request-options'),
        ]);

        setServices(servicesResponse.data.data);
        setBookingOptions(optionsResponse.data.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            'Unable to load services. Please check your connection and sign-in status.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const selectedService = services.find(
    (service) => String(service.service_id) === selectedServiceId,
  );

  const selectedOption = bookingOptions.find(
    (option) =>
      `${option.booking_id}-${option.room_id}` === selectedBookingRoom,
  );

  const total = selectedService
    ? Number(selectedService.current_price) * quantity
    : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedService || !selectedOption || quantity < 1) {
      setError('Select a service and an eligible booking and room.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await api.post('/service-requests', {
        bookingId: Number(selectedOption.booking_id),
        roomId: Number(selectedOption.room_id),
        serviceId: Number(selectedService.service_id),
        quantity: Number(quantity),
      });

      setSubmittedRequest(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Unable to submit the service request. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-gray-700">
        Loading services and eligible bookings...
      </div>
    );
  }

  if (submittedRequest) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-green-200 bg-green-50 p-6">
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          Service Request Submitted
        </h1>

        <p className="mb-4 text-sm text-gray-700">
          Your request was saved successfully.
        </p>

        <div className="rounded-md bg-white p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Service</span>
            <span className="font-medium text-gray-900">
              {submittedRequest.service_name}
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-gray-600">Room</span>
            <span className="font-medium text-gray-900">
              {selectedOption?.room_number}
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-gray-600">Quantity</span>
            <span className="font-medium text-gray-900">
              {submittedRequest.quantity}
            </span>
          </div>

          <div className="flex justify-between border-t pt-2">
            <span className="font-medium text-gray-700">Estimated Charge</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(
                Number(submittedRequest.price_at_usage) *
                  submittedRequest.quantity,
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSubmittedRequest(null);
            setSelectedServiceId('');
            setQuantity(1);
          }}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Request Another Service
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-gray-900">
        Request a Service
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        Select a service and an active booking.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4">
          <label
            htmlFor="bookingRoom"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Booking and Room
          </label>

          <select
            id="bookingRoom"
            value={selectedBookingRoom}
            onChange={(event) => setSelectedBookingRoom(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select a booking and room</option>

            {bookingOptions.map((option) => (
              <option
                key={`${option.booking_id}-${option.room_id}`}
                value={`${option.booking_id}-${option.room_id}`}
              >
                {option.guest_name} — Room {option.room_number}
              </option>
            ))}
          </select>

          {bookingOptions.length === 0 && (
            <p className="mt-1 text-sm text-amber-700">
              No currently checked-in bookings are eligible for service
              requests.
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="service"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Service
          </label>

          <select
            id="service"
            value={selectedServiceId}
            onChange={(event) => setSelectedServiceId(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select a service</option>

            {services.map((service) => (
              <option
                key={service.service_id}
                value={service.service_id}
              >
                {service.service_name} —{' '}
                {formatCurrency(service.current_price)}
              </option>
            ))}
          </select>
        </div>

        {selectedService && (
          <div className="mb-4 rounded-md bg-gray-50 p-3">
            <p className="font-medium text-gray-900">
              {selectedService.service_name}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              {selectedService.service_description}
            </p>

            <p className="mt-2 text-sm font-medium text-gray-700">
              Price: {formatCurrency(selectedService.current_price)}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="quantity"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Quantity
          </label>

          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => {
              const value = Number(event.target.value);
              setQuantity(
                Number.isSafeInteger(value) && value > 0 ? value : 1,
              );
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {selectedService && (
          <div className="mb-5 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Estimated total</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              submitting ||
              !selectedService ||
              !selectedOption ||
              services.length === 0
            }
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? 'Submitting...' : 'Submit Service Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestServicePage;