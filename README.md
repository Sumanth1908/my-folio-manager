# My Folio Manager

A comprehensive personal finance and portfolio management application designed to track net worth, manage transactions, and automate financial calculations like interest accruals for various account types.

## 🚀 Features

-   **Portfolio Management**: Track Savings, Loans, Fixed Deposits, and Investment holdings in one place.
-   **Visual Dashboards**: 
    -   Real-time Net Worth calculation across all account types.
    -   Interactive **Cashflow Sankey Charts** to visualize money movement.
    -   Category-wise spending breakdowns.
-   **Transaction Tracking**: Full history with categorization and currency support.
-   **Automated Interest Accruals**: Background jobs handled by Celery to automatically calculate and apply interest to Savings and Loan accounts.
-   **Multi-Currency**: Support for multiple currencies with real-time conversion capabilities.
-   **Secure Authentication**: JWT-based login and registration.

## 🛠 Tech Stack

### Backend
-   **Language**: Python 3.11+
-   **Framework**: FastAPI
-   **Database**: PostgreSQL (via SQLModel)
-   **Background Jobs**: Celery with Redis
-   **Dependency Management**: Poetry

### Frontend (Web)
-   **Framework**: React 18+ (TypeScript)
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **State Management**: TanStack Query (React Query)
-   **Charts**: Recharts

### Mobile App
-   **Framework**: Flutter (Dart)
-   **State Management**: Riverpod
-   **Navigation**: GoRouter
-   **Networking**: Dio
-   **Data Models**: Freezed & JSON Serializable

---

## 🏗 Setup & Installation

### Prerequisites
-   Docker & Docker Compose
-   Python 3.11+ & Poetry
-   Node.js & npm
-   Flutter SDK (3.x) & Dart

### 1. Infrastructure Services
Start the database and Redis services using Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
poetry install
poetry run python dev.py
```
*The backend will be available at http://localhost:8000. You can access the API docs at http://localhost:8000/docs.*

### 3. Background Tasks (Celery)
To process interest accruals and automation rules, start the Celery worker and beat in separate terminals:
```bash
cd backend
# Run worker
poetry run worker

# Run beat (in another terminal)
poetry run beat
```

### 4. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*The web interface will be available at http://localhost:5173.*

### 5. Mobile App Setup
Navigate to the `mobile` directory:
```bash
cd mobile
flutter pub get
```

#### Running locally
```bash
flutter run
```
*The app will launch on your connected emulator or physical device. On the first launch, you will be prompted to enter your backend server URL.*

#### Code Generation (Freezed / Riverpod)
If you modify the data models or providers, you will need to regenerate the `.g.dart` and `.freezed.dart` files:
```bash
dart run build_runner build --delete-conflicting-outputs
```

#### Building for Production
**Android (APK or App Bundle)**
```bash
# Build an APK (easiest for sharing)
flutter build apk --release

# Build an App Bundle (required for Play Store)
flutter build appbundle --release
```

**iOS (IPA)**
To build for iOS, you need to be on a macOS machine with Xcode installed.
```bash
# You may need to install CocoaPods dependencies first
cd ios
pod install
cd ..

# Build the IPA
flutter build ipa --release
```

---

## 📁 Project Structure

```text
├── backend/            # FastAPI source code, models, and background tasks
├── frontend/           # React application, components, and hooks
├── mobile/             # Flutter (iOS/Android) mobile application
├── docker-compose.yml  # Database and Redis configuration
└── README.md           # Project documentation
```

## ⚙️ Background Tasks
Interest accruals are processed automatically on the 1st of every month (or as configured per account). Ensure the Celery worker and beat are running (can be started via `poetry run worker` and `poetry run beat`).
