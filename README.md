# Premium Store — AI Chatbot & Subscription Demo (frontend only)

Run: open the folder in VS Code and use **Live Server** (or `python3 -m http.server`), then open `index.html` (customer) and `admin.html` (owner) in the same browser profile. Refresh a page to see changes from the other.

## Demo limitations

- LocalStorage is not secure; `admin.html` has no real authentication.
- No real AI: replies are keyword matches against the knowledge base. No real payment check, SMS, WhatsApp or email.
- Screenshots are resized (max 900px JPEG) and stored as data URLs; LocalStorage holds about 5 MB, so many uploads will fill it (reset in Settings).
- Data is per browser profile; multiple real users need a backend.
- Do not enter real passwords or payment details. Sample codes are fictional.
- Expired subscriptions are detected on load; their codes disappear from the customer view while admin payment/order/audit records remain.
