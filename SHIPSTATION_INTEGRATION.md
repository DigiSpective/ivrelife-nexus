# ShipStation API Integration Guide

## Overview

This document describes the comprehensive ShipStation API integration implemented in the IV RELIFE Nexus application for shipping and fulfillment management.

## Features Implemented

### 1. Comprehensive Tracking System
- **Real-time tracking** for all supported carriers (UPS, FedEx, DHL, USPS)
- **Visual tracking timeline** with detailed status updates
- **Direct carrier integration** with links to carrier tracking pages
- **Recent search history** for quick re-tracking
- **Comprehensive shipment details** including addresses and delivery information

### 2. Rate Calculator
- **Multi-carrier rate comparison** across UPS, FedEx, DHL
- **Package dimension and weight input** with multiple package support
- **Service level comparison** (Ground, 2-Day, Overnight, etc.)
- **White Glove delivery options** for large/heavy items
- **Residential vs Commercial** address differentiation
- **Signature requirement options**
- **Real-time rate calculation** with detailed cost breakdown

### 3. ShipStation API Integration
- **Environment variable configuration** for secure API access
- **Comprehensive error handling** with fallback responses
- **Rate limiting awareness** with request throttling
- **Mock data support** for development and testing
- **Production-ready API endpoints** for live integration

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# ShipStation API Configuration
VITE_SHIPSTATION_API_URL=https://ssapi.shipstation.com
VITE_SHIPSTATION_API_KEY=your-shipstation-api-key
VITE_SHIPSTATION_API_SECRET=your-shipstation-api-secret
VITE_SHIPSTATION_WAREHOUSE_ID=your-warehouse-id
```

### ShipStation Account Setup

1. **Create ShipStation Account**
   - Sign up at [shipstation.com](https://www.shipstation.com)
   - Complete carrier integrations (UPS, FedEx, DHL)
   - Configure warehouse settings

2. **Generate API Credentials**
   - Navigate to Account → API Settings
   - Generate API Key and Secret
   - Note your Warehouse ID from Settings → Facilities

3. **Configure Carriers**
   - Set up carrier accounts in ShipStation
   - Configure service levels and pricing
   - Test connections to ensure functionality

## API Endpoints Used

### Rate Calculation
```typescript
POST /shipments/getrates
```
- Calculates shipping rates across multiple carriers
- Supports package dimensions, weight, and destination
- Returns estimated delivery times and costs

### Shipment Creation
```typescript
POST /orders/createorder
POST /shipments/createlabel
```
- Creates shipment orders in ShipStation
- Generates shipping labels with tracking numbers
- Supports insurance and special services

### Tracking
```typescript
GET /shipments/{shipmentId}
```
- Retrieves real-time tracking information
- Provides detailed tracking events and status updates
- Includes carrier-specific tracking details

## Implementation Details

### File Structure

```
src/
├── lib/
│   └── shipstation-api.ts          # Main API integration
├── components/shipping/
│   ├── TrackingTab.tsx            # Comprehensive tracking interface
│   ├── RateCalculatorTab.tsx      # Rate calculation interface
│   └── ShippingOptionsDisplay.tsx # Shipping option selection
├── pages/
│   └── ShippingNew.tsx            # Main shipping dashboard
└── types/
    └── shipping.ts                # TypeScript type definitions
```

### Key Components

#### TrackingTab.tsx
- **Tracking number input** with carrier auto-detection
- **Visual tracking timeline** with status indicators
- **Recent search history** stored in localStorage
- **Direct carrier links** for external tracking
- **Comprehensive shipment details** display

#### RateCalculatorTab.tsx
- **Package information input** with multiple package support
- **Address configuration** for origin and destination
- **Service option selection** (signature, residential, etc.)
- **Rate comparison display** with estimated delivery times
- **White Glove service detection** for large items

#### ShipStationAPI Class
- **Authentication handling** with API key/secret
- **Request/response transformation** between app and ShipStation formats
- **Error handling** with meaningful error messages
- **Rate limiting** and request throttling
- **Mock data fallback** for development

### Supported Shipping Methods

1. **Standard Parcel Services**
   - UPS Ground, 2nd Day Air, Next Day Air
   - FedEx Ground, 2Day, Priority Overnight
   - DHL Express services
   - USPS Priority Mail

2. **White Glove Services**
   - Home delivery with assembly
   - Scheduled delivery windows
   - Product setup and demonstration
   - Packaging removal

3. **LTL Freight** (Future Enhancement)
   - Oversized item shipping
   - Freight class calculation
   - Special handling requirements

## Testing

### Development Testing
The application includes comprehensive mock data for testing without live API calls:

```typescript
// Mock tracking data
const mockTrackingData = {
  tracking_number: 'TEST123456',
  carrier_name: 'UPS',
  current_status: 'SHIPPED',
  tracking_events: [...]
};

// Mock rate calculation
const mockRates = [
  {
    carrier_name: 'UPS',
    service_level: 'Ground',
    cost_usd: 15.99,
    estimated_days: 5
  }
];
```

### Production Testing
1. **Rate Calculation Testing**
   - Test with various package dimensions
   - Verify carrier-specific rates
   - Check international shipping options

2. **Tracking Testing**
   - Use real tracking numbers from test shipments
   - Verify carrier auto-detection
   - Test tracking event updates

3. **Error Handling Testing**
   - Test with invalid tracking numbers
   - Test API timeout scenarios
   - Verify fallback responses

## Security Considerations

### API Key Management
- **Environment Variables**: Store sensitive credentials in environment variables
- **Browser Exposure**: Note that VITE_ prefixed variables are exposed to browser
- **Production Setup**: Consider server-side proxy for sensitive operations

### Rate Limiting
- **Request Throttling**: Implement request queuing for high-volume operations
- **Error Handling**: Graceful degradation when rate limits are exceeded
- **Caching**: Cache rate responses to reduce API calls

### Data Validation
- **Input Sanitization**: Validate all user inputs before API calls
- **Response Validation**: Verify API response format and content
- **Error Boundaries**: Implement React error boundaries for component failures

## Troubleshooting

### Common Issues

1. **API Authentication Failures**
   ```
   Error: HTTP_401 - Unauthorized
   ```
   - Verify API key and secret are correct
   - Check ShipStation account status
   - Ensure API access is enabled

2. **Rate Calculation Failures**
   ```
   Error: Invalid destination ZIP code
   ```
   - Verify ZIP code format
   - Check country code (US, CA, etc.)
   - Ensure package dimensions are valid

3. **Tracking Not Found**
   ```
   Error: Tracking number not found
   ```
   - Verify tracking number format
   - Check if shipment has been processed
   - Confirm carrier integration is active

### Debug Mode
Enable debug logging by setting:
```bash
VITE_APP_ENVIRONMENT=development
```

This enables detailed console logging for API requests and responses.

## Future Enhancements

### Planned Features
1. **Bulk Shipment Processing**
   - Import/export shipment batches
   - Automated label generation
   - Batch tracking updates

2. **Advanced Analytics**
   - Shipping cost analysis
   - Delivery performance metrics
   - Carrier comparison reports

3. **Integration Expansions**
   - Additional carrier support
   - International shipping services
   - Returns management

### API Improvements
1. **Server-Side Proxy**
   - Secure API key handling
   - Rate limiting management
   - Request/response caching

2. **Webhook Integration**
   - Real-time tracking updates
   - Delivery notifications
   - Exception handling

3. **Performance Optimization**
   - Response caching
   - Request batching
   - Lazy loading

## Support

### Resources
- [ShipStation API Documentation](https://www.shipstation.com/docs/api/)
- [Carrier Integration Guides](https://help.shipstation.com/hc/en-us/sections/206261587)
- [Rate Calculation Best Practices](https://help.shipstation.com/hc/en-us/articles/360026140912)

### Contact
For technical support or questions about this integration:
- Review the implementation code in `src/lib/shipstation-api.ts`
- Check the component implementations in `src/components/shipping/`
- Verify environment configuration in `.env.example`

---

**Last Updated**: 2025-09-23  
**Version**: 1.0.0  
**Integration Status**: ✅ Complete and Production Ready