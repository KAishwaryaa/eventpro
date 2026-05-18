import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  available: number;
}

export default function QuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 10,
  available,
}: QuantitySelectorProps) {
  const effectiveMax = Math.min(max, available);

  const handleDecrease = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < effectiveMax) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= effectiveMax) {
      onChange(value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Select Quantity</h2>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleDecrease}
          disabled={quantity <= min}
          className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Minus size={20} />
        </button>

        <input
          type="number"
          value={quantity}
          onChange={handleInputChange}
          min={min}
          max={effectiveMax}
          className="w-20 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        <button
          onClick={handleIncrease}
          disabled={quantity >= effectiveMax}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {available} tickets available (max {max} per order)
        </p>
      </div>
    </div>
  );
}
