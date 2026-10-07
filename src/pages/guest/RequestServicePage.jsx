import { useState } from 'react';

const mockServices = [
  {
    serviceId: 1,
    serviceName: 'Room Service',
    serviceDescription: 'Food and beverages delivered to your room.',
    currentPrice: 2500,
  },
  {
    serviceId: 2,
    serviceName: 'Laundry',
    serviceDescription: 'Laundry and clothing cleaning service.',
    currentPrice: 1500,
  },
  {
    serviceId: 3,
    serviceName: 'Spa',
    serviceDescription: 'Relaxing spa and wellness service.',
    currentPrice: 5000,
  },
  {
    serviceId: 4,
    serviceName: 'Transportation',
    serviceDescription: 'Hotel transportation service.',
    currentPrice: 3500,
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);

const RequestServicePage = () => {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedService = mockServices.find(
    (service) => service.serviceId === Number(selectedServiceId),
  );

  const total = selectedService
    ? selectedService.currentPrice * quantity
    : 0;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedService) {
      return;
    }

    const requestData = {
      bookingId: 1,
      roomId: 101,
      serviceId: selectedService.serviceId,
      quantity,
      instructions,
    };

    console.log('Service request:', requestData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-green-200 bg-green-50 p-6">
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          Service Request Submitted
        </h1>

        <p className="mb-4 text-sm text-gray-600">
          Your service request has been submitted successfully.
        </p>

        <div className="rounded-md bg-white p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Service</span>
            <span className="font-medium text-gray-900">
              {selectedService.serviceName}
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-gray-600">Quantity</span>
            <span className="font-medium text-gray-900">{quantity}</span>
          </div>

          <div className="flex justify-between border-t pt-2">
            <span className="font-medium text-gray-700">Estimated Charge</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setSelectedServiceId('');
            setQuantity(1);
            setInstructions('');
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
        Select a hotel service and provide the required details.
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
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

            {mockServices.map((service) => (
              <option key={service.serviceId} value={service.serviceId}>
                {service.serviceName} - {formatCurrency(service.currentPrice)}
              </option>
            ))}
          </select>
        </div>

        {selectedService && (
          <div className="mb-4 rounded-md bg-gray-50 p-3">
            <p className="font-medium text-gray-900">
              {selectedService.serviceName}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              {selectedService.serviceDescription}
            </p>

            <p className="mt-2 text-sm font-medium text-gray-700">
              Price: {formatCurrency(selectedService.currentPrice)}
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
            value={quantity}
            onChange={(event) =>
              setQuantity(Math.max(1, Number(event.target.value)))
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="instructions"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Special Instructions
          </label>

          <textarea
            id="instructions"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={4}
            placeholder="Enter any special instructions..."
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
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
            disabled={!selectedService}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Submit Service Request
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestServicePage;
