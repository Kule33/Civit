# Payment Flow Architecture

## Overview
This system uses a **separate payment server (localhost:5025)** to handle PayHere merchant credentials, hash generation, and payment logging. The main backend (localhost:5201) acts as an intermediary.

## Payment Flow

### 1. Frontend → Backend (localhost:5201)
**Endpoint:** `POST /api/payments/card`

**Request Body:**
```json
{
  "amount": 1500,
  "paperId": "12321",
  "currency": "LKR",
  "paymentId": "156233524",
  "questionsList": []
}
```

### 2. Backend → Payment Server (localhost:5025)
**Endpoint:** `POST /api/payment/create-order`

**Request Body:**
```json
{
  "orderId": "UUID-GENERATED",
  "paperId": "12321",
  "paymentId": "156233524",
  "amount": 1500,
  "currency": "LKR",
  "userId": "user-uuid-from-jwt",
  "userName": "Customer Name",
  "email": "customer@example.com"
}
```

**What Payment Server Does:**
1. Receives payment details
2. Calculates MD5 hash using merchant secret: `MD5(merchantId + orderId + amount + currency + merchantSecret)`
3. Stores payment record in its own database with userId, userName, email
4. Returns PayHere parameters

### 3. Payment Server → Backend Response
```json
{
  "success": true,
  "merchantId": "YOUR_MERCHANT_ID",
  "amount": 1500,
  "hash": "CALCULATED_MD5_HASH",
  "notifyUrl": "https://yoursite.com/api/payments/payhere-callback",
  "cancelUrl": "https://yoursite.com/payment/cancel",
  "returnUrl": "https://yoursite.com/payment/success",
  "email": "customer@example.com",
  "orderId": "UUID-GENERATED",
  "currency": "LKR"
}
```

### 4. Backend → Frontend Response
```json
{
  "success": true,
  "transactionId": "UUID-GENERATED",
  "message": "Payment order created successfully",
  "paymentDetails": {
    "merchantId": "YOUR_MERCHANT_ID",
    "amount": 1500,
    "hash": "CALCULATED_MD5_HASH",
    "notifyUrl": "https://yoursite.com/api/payments/payhere-callback",
    "cancelUrl": "https://yoursite.com/payment/cancel",
    "returnUrl": "https://yoursite.com/payment/success",
    "email": "customer@example.com",
    "orderId": "UUID-GENERATED",
    "currency": "LKR",
    "items": "Paper 12321",
    "firstName": "Customer",
    "lastName": "Name"
  }
}
```

**Note:** `userId` is NOT sent to frontend for security reasons.

### 5. Frontend → PayHere
Frontend creates a form with all payment details and submits to:
- **Sandbox:** `https://sandbox.payhere.lk/pay/checkout`
- **Production:** `https://www.payhere.lk/pay/checkout`

**Form Fields:**
- merchant_id
- return_url
- cancel_url
- notify_url
- order_id
- items
- currency
- amount
- first_name
- last_name
- email
- phone
- address
- city
- country
- hash

### 6. PayHere → Backend Webhook
**Endpoint:** `POST /api/payments/payhere-callback` (AllowAnonymous)

PayHere sends payment status to notify_url with signature for verification.

## Security Features

1. **JWT Authentication:** Main backend requires auth token
2. **Separate Payment Server:** Merchant credentials never exposed to main backend
3. **MD5 Hash Verification:** Payment server validates PayHere callbacks
4. **User ID Protection:** userId not sent to frontend
5. **HTTPS Required:** All communication uses HTTPS in production

## Configuration

### Backend (localhost:5201) - appsettings.json
```json
{
  "PaymentServer": {
    "Url": "http://localhost:5025"
  }
}
```

### Payment Server (localhost:5025) - Should Have
```json
{
  "PayHere": {
    "MerchantId": "YOUR_MERCHANT_ID",
    "MerchantSecret": "YOUR_MERCHANT_SECRET",
    "IsSandbox": "true",
    "ReturnUrl": "https://yoursite.com/payment/success",
    "CancelUrl": "https://yoursite.com/payment/cancel",
    "NotifyUrl": "https://yoursite.com/api/payments/payhere-callback"
  }
}
```

## Files Created/Modified

### Backend (localhost:5201)
- `Controllers/PaymentController.cs` - Handles payment API endpoints
- `Services/Payment/PaymentService.cs` - Business logic
- `Services/Payment/API/PaymentServerClient.cs` - HTTP client for payment server
- `Services/Payment/API/PaymentServerModels.cs` - Request/Response models
- `DTOs/PaymentRequestDto.cs` - Input validation
- `DTOs/PaymentResponseDto.cs` - Response with PayHere details
- `Program.cs` - Dependency injection setup

### Frontend
- `src/payment/api/api.ts` - API client with PayHere models
- `src/routes/Teacher/Dashboard.jsx` - Payment form submission

## Next Steps for Payment Server (localhost:5025)

The payment server needs to implement:

1. **POST /api/payment/create-order** endpoint
   - Receive: orderId, paperId, paymentId, amount, currency, userId, userName, email
   - Calculate MD5 hash
   - Store in database
   - Return PayHere parameters

2. **Database Schema:**
   ```sql
   CREATE TABLE payments (
     id UUID PRIMARY KEY,
     order_id VARCHAR(50) UNIQUE NOT NULL,
     user_id VARCHAR(50) NOT NULL,
     user_name VARCHAR(100),
     email VARCHAR(100),
     paper_id VARCHAR(50),
     payment_id VARCHAR(50),
     amount DECIMAL(10,2),
     currency VARCHAR(3),
     status VARCHAR(20), -- 'Pending', 'Success', 'Failed', 'Cancelled'
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP
   );
   ```

3. **Hash Calculation:**
   ```csharp
   var hashString = $"{merchantId}{orderId}{amount:F2}{currency}{merchantSecret}";
   var hash = MD5(hashString).ToUpper();
   ```
