# Wholesale Leads Client

A React application for managing wholesale leads with dropdown selection and data table display.

## Features

- Dropdown menu populated from backend API
- Submit button to fetch data based on selection
- Dynamic data table display
- Export to CSV functionality
- Responsive design
- Authentication support (API Key, Secret, Token)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

## Configuration

Edit the `.env` file to configure your backend API:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:8000

# API Authentication (if needed)
REACT_APP_API_KEY=your-api-key-here
REACT_APP_API_SECRET=your-api-secret-here
REACT_APP_AUTH_TOKEN=your-auth-token-here
```

## Running the Application

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Building for Production

Create a production build:
```bash
npm run build
```

The build files will be in the `build` directory.

## Usage

1. Select an option from the dropdown menu
2. Click the "Submit" button
3. View the fetched data in the table
4. Click "Export to CSV" to download the data

## API Endpoints Used

- `GET /api/dropdown-options` - Fetch dropdown menu options
- `POST /api/table-data` - Fetch table data based on selection

## Technologies Used

- React 18
- Axios for API calls
- CSS for styling
- Environment variables for configuration
