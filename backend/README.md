# LocalPulse Backend API Boilerplate

This is the production-ready FastAPI backend architecture and boilerplate for the **LocalPulse** application.

## Project Structure

The project follows a standard decoupled controller-service-model-database design pattern.

```
backend/
├── app/
│   ├── main.py                 # FastAPI application creation and configuration
│   ├── core/                   # Application configurations, DB connections, and JWT helpers
│   ├── api/                    # Controllers/Routers defining HTTP endpoints
│   ├── models/                 # Database schema templates and ODM definitions
│   ├── schemas/                # Pydantic request & response validation layers
│   ├── services/               # Business logic layers (mocked)
│   ├── middleware/             # Role authorization, exception handlers, and security middleware
│   └── utils/                  # Centralized response templates and utility tools
├── uploads/                    # Directory for managing uploads
│   └── temp/                   # Temporary upload directory
├── requirements.txt            # Python package dependencies
├── .env.example                # Config template file for setup
├── README.md                   # Documentation
└── run.py                      # Main runner script
```

## Setup Instructions

1. **Create Python 3.13 Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Modify the settings in `.env` as required

4. **Run Application:**
   ```bash
   python run.py
   # Or using uvicorn directly:
   uvicorn app.main:app --reload
   ```

5. **API Documentation:**
   - Swagger Interactive Documentation: `http://127.0.0.1:8000/docs`
   - ReDoc Alternative Documentation: `http://127.0.0.1:8000/redoc`

## Architecture Flow

All endpoints follow this strict directional flow to separate concerns:

`Client Request -> API Router (Controller) -> Service Class -> Data Model -> Database`

- **Controller**: Parses incoming requests, validates models using schemas, extracts headers/tokens, and passes control to the service layer.
- **Service**: Executes business logic and external helper logic (e.g., Cloudinary, Gemini AI, geodistance checks), calling models as necessary.
- **Model**: Interface for structural DB schema definitions and helper ODM properties.
- **Utils**: Offers helpers like standard response formats, geodistances, and sanitization routines.
