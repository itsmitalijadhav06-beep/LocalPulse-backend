import os
# pyrefly: ignore [missing-import]
import uvicorn
from dotenv import load_dotenv

# Load local environment variables from file if present
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
    env = os.getenv("ENV", "development")

    # Run the uvicorn app programmatically
    # reload should be True in development and False in production
    reload_enabled = debug and (env != "production")

    print(f"Starting LocalPulse backend server on {host}:{port} with reload={reload_enabled}...")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload_enabled,
        log_level="info",
    )
