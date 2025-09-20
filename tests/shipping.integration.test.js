// Shipping Integration Tests
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Shipping from '../src/pages/Shipping';
import { useShippingProviders, useFulfillments } from '../src/hooks/useShipping';

// Mock the hooks
jest.mock('../src/hooks/useShipping', () => ({
  useShippingProviders: jest.fn(),
  useFulfillments: jest.fn(),
  useShippingQuotes: jest.fn(),
  useCreateFulfillment: jest.fn(),
  useCreateShippingProvider: jest.fn(),
  useUpdateShippingProvider: jest.fn(),
  useDeleteShippingProvider: jest.fn(),
  useCreateShippingMethod: jest.fn(),
  useUpdateShippingMethod: jest.fn(),
  useDeleteShippingMethod: jest.fn(),
  useCreateShippingQuote: jest.fn(),
  useUpdateFulfillment: jest.fn(),
}));

// Mock the components
jest.mock('../src/components/shipping/QuoteRequestForm', () => ({
  QuoteRequestForm: () => <div data-testid="quote-request-form">Quote Request Form</div>,
}));

jest.mock('../src/components/shipping/QuotesList', () => ({
  QuotesList: () => <div data-testid="quotes-list">Quotes List</div>,
}));

jest.mock('../src/components/shipping/FulfillmentModal', () => ({
  FulfillmentModal: () => <div data-testid="fulfillment-modal">Fulfillment Modal</div>,
}));

jest.mock('../src/components/shipping/ProvidersTable', () => ({
  ProvidersTable: () => <div data-testid="providers-table">Providers Table</div>,
}));

jest.mock('../src/components/shipping/ShipmentsTable', () => ({
  ShipmentsTable: () => <div data-testid="shipments-table">Shipments Table</div>,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Plus: () => <div>Plus Icon</div>,
  Search: () => <div>Search Icon</div>,
  Filter: () => <div>Filter Icon</div>,
  Eye: () => <div>Eye Icon</div>,
  Truck: () => <div>Truck Icon</div>,
  Package: () => <div>Package Icon</div>,
  BarChart3: () => <div>BarChart Icon</div>,
  Clock: () => <div>Clock Icon</div>,
  AlertCircle: () => <div>Alert Icon</div>,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const queryClient = new QueryClient();

const renderWithProviders = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Shipping Page', () => {
  beforeEach(() => {
    useShippingProviders.mockReturnValue({
      data: {
        data: [
          { id: '1', name: 'UPS', created_at: '2023-01-01' },
          { id: '2', name: 'FedEx', created_at: '2023-01-01' },
        ]
      },
      isLoading: false
    });

    useFulfillments.mockReturnValue({
      data: {
        data: [
          { 
            id: '1', 
            order_id: 'ord-1001',
            tracking_number: 'UPS123456789',
            provider_id: '1',
            method_id: '1',
            status: 'in_transit',
            created_at: '2023-01-01'
          }
        ]
      },
      isLoading: false
    });
  });

  test('renders shipping dashboard', async () => {
    renderWithProviders(<Shipping />);
    
    // Check that the main title is rendered
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    
    // Check that the dashboard tab is active by default
    expect(screen.getByText('Dashboard')).toHaveClass('bg-primary');
    
    // Check that KPIs are displayed
    expect(screen.getByText('Active Shipments')).toBeInTheDocument();
    expect(screen.getByText('Delayed Shipments')).toBeInTheDocument();
    expect(screen.getByText('Pending Fulfillments')).toBeInTheDocument();
    
    // Check that the quote request form is rendered
    expect(screen.getByTestId('quote-request-form')).toBeInTheDocument();
    
    // Check that the shipments table is rendered
    expect(screen.getByTestId('shipments-table')).toBeInTheDocument();
  });

  test('switches between tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Shipping />);
    
    // Click on the Quotes tab
    await user.click(screen.getByText('Quotes'));
    expect(screen.getByText('Quotes')).toHaveClass('bg-primary');
    expect(screen.getByTestId('quote-request-form')).toBeInTheDocument();
    expect(screen.getByTestId('quotes-list')).toBeInTheDocument();
    
    // Click on the Shipments tab
    await user.click(screen.getByText('Shipments'));
    expect(screen.getByText('Shipments')).toHaveClass('bg-primary');
    expect(screen.getByTestId('shipments-table')).toBeInTheDocument();
    
    // Click on the Providers tab
    await user.click(screen.getByText('Providers'));
    expect(screen.getByText('Providers')).toHaveClass('bg-primary');
    expect(screen.getByTestId('providers-table')).toBeInTheDocument();
  });

  test('opens fulfillment modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Shipping />);
    
    // Click the "Create Shipment" button
    await user.click(screen.getByText('Create Shipment'));
    
    // Check that the fulfillment modal is rendered
    expect(screen.getByTestId('fulfillment-modal')).toBeInTheDocument();
  });
});