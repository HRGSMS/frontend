import type { FC } from 'react';
import { useState } from 'react';
import Table from '../components/common/Table';
import type { Column } from '../components/common/Table';
import CommonButton from '../components/common/Button';
import Modal from '../components/common/Modal';
import FormInput from '../components/common/FormInput';

export interface ServiceCatalogItem {
  id: number;
  name: string;
  category: 'Dining' | 'Wellness' | 'Housekeeping' | 'Transport' | 'Facilities';
  price: number;
  isActive: boolean;
  description: string;
}

const mockCatalog: ServiceCatalogItem[] = [
  {
    id: 1,
    name: 'Continental Breakfast',
    category: 'Dining',
    price: 2500,
    isActive: true,
    description: 'Fresh croissants, eggs, fruits and coffee',
  },
  {
    id: 2,
    name: 'Airport Shuttle (One Way)',
    category: 'Transport',
    price: 8000,
    isActive: true,
    description: 'Air-conditioned luxury transfer',
  },
  {
    id: 3,
    name: 'Full Body Ayurvedic Massage (60 min)',
    category: 'Wellness',
    price: 12000,
    isActive: true,
    description: 'Herbal oils with experienced therapist',
  },
  {
    id: 4,
    name: 'Laundry - Dry Cleaning Suit',
    category: 'Housekeeping',
    price: 1500,
    isActive: true,
    description: 'Same-day return available',
  },
  {
    id: 5,
    name: 'Conference Room (Per Hour)',
    category: 'Facilities',
    price: 5000,
    isActive: true,
    description: 'Includes projector, high-speed WiFi and water',
  },
];

export const ServiceCatalogManagementPage: FC = () => {
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>(mockCatalog);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCatalogItem['category']>('Dining');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(val);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategory('Dining');
    setPrice('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ServiceCatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(String(item.price));
    setDescription(item.description);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !price) return;

    if (editingItem) {
      setCatalog((prev) =>
        prev.map((c) =>
          c.id === editingItem.id ? { ...c, name, category, price: Number(price), description } : c,
        ),
      );
    } else {
      const newItem: ServiceCatalogItem = {
        id: Date.now(),
        name,
        category,
        price: Number(price),
        isActive: true,
        description,
      };
      setCatalog([newItem, ...catalog]);
    }
    setModalOpen(false);
  };

  const handleToggleActive = (id: number) => {
    setCatalog((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
  };

  const columns: Column<ServiceCatalogItem>[] = [
    { header: 'Service Name', accessor: 'name', sortable: true },
    {
      header: 'Category',
      render: (r) => (
        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 font-medium text-gray-700">
          {r.category}
        </span>
      ),
    },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Price',
      accessor: 'price',
      sortable: true,
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCurrency(r.price)}</span>,
    },
    {
      header: 'Status',
      align: 'center',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {r.isActive ? 'Available' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <CommonButton size="sm" variant="outline" onClick={() => handleOpenEdit(r)}>
            Edit Price
          </CommonButton>
          <CommonButton size="sm" variant="ghost" onClick={() => handleToggleActive(r.id)}>
            {r.isActive ? 'Disable' : 'Enable'}
          </CommonButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalog Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Maintain guest amenities, dining menus, wellness services, and update billing rates.
          </p>
        </div>

        <CommonButton onClick={handleOpenAdd}>+ New Service Item</CommonButton>
      </div>

      <Table
        columns={columns}
        data={catalog}
        keyExtractor={(r) => r.id}
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) || row.category.toLowerCase().includes(q)
        }
        searchPlaceholder="Filter catalog..."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Service' : 'Add Service'}
        description="Update service name, category, and standard pricing."
        footer={
          <>
            <CommonButton variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </CommonButton>
            <CommonButton onClick={handleSave}>Save Changes</CommonButton>
          </>
        }
      >
        <div className="space-y-3">
          <FormInput
            label="Service Name"
            placeholder="e.g. Continental Breakfast"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCatalogItem['category'])}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-gray-900"
            >
              <option value="Dining">Dining</option>
              <option value="Wellness">Wellness</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Transport">Transport</option>
              <option value="Facilities">Facilities</option>
            </select>
          </div>
          <FormInput
            label="Standard Price (LKR)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <FormInput
            label="Description"
            placeholder="Description or notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ServiceCatalogManagementPage;
