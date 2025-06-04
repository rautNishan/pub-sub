# Laravel & Node.js Notification System

This project demonstrates a simple notification system built using Laravel (API & authentication) and Node.js (RabbitMQ consumer and reporting).

## Project Structure

- **Laravel API (Port: 8000)**  
  Handles user authentication and notification creation.

- **Node.js API (Port: 3000)**  
  Consumes notifications and exposes summary endpoints.

---

## 🚀 Getting Started

### Step 1: Start Services

Make sure Docker is installed, then run:

```bash
sudo docker compose up


Step 2: Register a User (Laravel API)
Endpoint:
POST http://localhost:8000/api/auth/register
Payload:
{
  "email": "user@example.com",
  "password": "password"
}

Step 3: Login
Endpoint:
POST http://localhost:8000/api/auth/login
Payload:
{
  "email": "user@example.com",
  "password": "password"
}
Response:
Returns a Bearer token.


Step 4: Check Login Status
Endpoint:
GET http://localhost:8000/api/auth/me
Headers:
Authorization: Bearer <your_token>

Step 5: Post a Notification
Endpoint:
POST http://localhost:8000/api/notification/create
Headers:
Authorization: Bearer <your_token>

Payload:
{
  "type": "email", or "sms"
  "payload": [
    {
      "teplateid": 1,
      "message": "Queue test 5",
      "next": "test"
    }
  ]
}
Step 6: Check Notifications (Node.js API)
Endpoint:
GET http://localhost:3000/notifications

Step 7: View Notification Summary
Endpoint:
GET http://localhost:3000/notifications/summary

