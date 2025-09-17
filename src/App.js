import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('search');
  const [progressMessage, setProgressMessage] = useState('');
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [streetViewImage, setStreetViewImage] = useState(null);
  const [streetViewLoading, setStreetViewLoading] = useState(false);
  const [streetViewError, setStreetViewError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const checkZipCodeStatus = async (zipCode) => {
    try {
      const response = await axios.get(`${API_URL}/api/status/${zipCode}`, axiosConfig);
      return response.data;
    } catch (err) {
      console.error('Error checking zip code status:', err);
      return null;
    }
  };

  const pollProgress = async (zipCode) => {
    let attempts = 0;
    const maxAttempts = 1000;

    const poll = async () => {
      try {
        const progressResponse = await axios.get(`${API_URL}/api/progress/${zipCode}`, axiosConfig);
        const progressData = progressResponse.data;

        setProgressMessage(progressData.message || 'Processing...');

        if (progressData.status === 'completed' && progressData.result) {
          setSearchResults(progressData.result.leads || []);
          setCurrentView('results');
          setIsScrapingInProgress(false);
          setProgressMessage('');
          return;
        } else if (progressData.status === 'error') {
          setError(progressData.message);
          setIsScrapingInProgress(false);
          setProgressMessage('');
          return;
        } else if (progressData.status === 'in_progress' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 3000); // Poll every 3 seconds
        } else if (attempts >= maxAttempts) {
          setError('Scraping is taking longer than expected. Please try again in a few minutes.');
          setIsScrapingInProgress(false);
          setProgressMessage('');
        }
      } catch (err) {
        console.error('Error polling progress:', err);
        setError('Error checking progress');
        setIsScrapingInProgress(false);
        setProgressMessage('');
      }
    };

    poll();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a zip code');
      return;
    }

    const zipCode = searchQuery.trim();

    try {
      setLoading(true);
      setError(null);
      setProgressMessage('');

      // First, check the status to see if data exists or scraping is in progress
      const status = await checkZipCodeStatus(zipCode);
      setCacheStatus(status);

      if (status && status.cached) {
        // Data is already cached, proceed with normal scrape request (it will return cached data)
        const response = await axios.post(
          `${API_URL}/api/scrape/${zipCode}`,
          {},
          axiosConfig
        );

        const results = response.data.leads || [];
        setSearchResults(results);
        setCurrentView('results');
        setLoading(false);
        return;
      }

      if (status && status.is_scraping) {
        // Scraping is already in progress, start polling
        setIsScrapingInProgress(true);
        setProgressMessage(status.scraping_progress || 'Scraping in progress...');
        pollProgress(zipCode);
        setLoading(false);
        return;
      }

      // No cached data and not currently scraping, start new scrape
      const response = await axios.post(
        `${API_URL}/api/scrape/${zipCode}`,
        {},
        axiosConfig
      );

      if (response.data.status === 'started') {
        // Scraping started, begin polling for progress
        setIsScrapingInProgress(true);
        setProgressMessage('Starting scrape...');
        pollProgress(zipCode);
      } else if (response.data.leads) {
        // Got results immediately (from cache)
        setSearchResults(response.data.leads);
        setCurrentView('results');
      } else {
        setError('Unexpected response from server');
      }

    } catch (err) {
      if (err.response) {
        setError(`API Error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
      } else if (err.request) {
        setError('Network error: Unable to reach the API');
      } else {
        setError('Request error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStreetViewImage = async (address) => {
    try {
      setStreetViewLoading(true);
      setStreetViewError(null);

      const response = await axios.get(`${API_URL}/api/street-view/image`, {
        params: { address },
        responseType: 'blob'
      });

      // Create blob URL for the image
      const imageBlob = new Blob([response.data], { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(imageBlob);
      setStreetViewImage(imageUrl);
    } catch (err) {
      console.error('Error fetching street view image:', err);
      setStreetViewError('Failed to load street view image');
    } finally {
      setStreetViewLoading(false);
    }
  };

  const handleAddressClick = (property) => {
    setSelectedProperty(property);
    setCurrentView('details');

    // Clear previous street view data
    setStreetViewImage(null);
    setStreetViewError(null);

    // Fetch street view image for the address
    const address = `${property["Property Address"]}, ${property["City"]}, ${property["State"]} ${property["Zip"]}`;
    fetchStreetViewImage(address);
  };

  const handleBackToSearch = () => {
    setCurrentView('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProperty(null);
    setError(null);
    setProgressMessage('');
    setIsScrapingInProgress(false);
    setCacheStatus(null);
  };

  const handleBackToResults = () => {
    setCurrentView('results');
    setSelectedProperty(null);

    // Clean up street view image URL to prevent memory leaks
    if (streetViewImage) {
      URL.revokeObjectURL(streetViewImage);
      setStreetViewImage(null);
    }
    setStreetViewError(null);
  };

  const renderSearchView = () => (
    <>
      <h1>Property Search</h1>
      <div className="controls">
        <div className="search-container">
          <label htmlFor="search-input">Enter Zip Code:</label>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., 90210"
            disabled={loading || isScrapingInProgress}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || isScrapingInProgress || !searchQuery.trim()}
          className="submit-btn"
        >
          {loading ? 'Checking...' : isScrapingInProgress ? 'Scraping...' : 'Search Properties'}
        </button>
      </div>

      {isScrapingInProgress && (
        <div className="progress-container">
          <div className="progress-message">
            <p><strong>Scraping in progress...</strong></p>
            <p>{progressMessage}</p>
            <div className="progress-bar">
              <div className="progress-bar-fill"></div>
            </div>
            <p className="progress-note">
              This may take a few minutes. Data is being collected and will be saved for future searches.
            </p>
          </div>
        </div>
      )}

      {cacheStatus && !cacheStatus.cached && !isScrapingInProgress && (
        <div className="cache-status">
          <p>No cached data found for this zip code. A new scrape will be started.</p>
          {cacheStatus.csv_available && (
            <p>CSV export will be available after scraping completes.</p>
          )}
        </div>
      )}
    </>
  );

  const renderResultsView = () => (
    <>
      <div className="header-with-back">
        <button onClick={handleBackToSearch} className="back-btn">
          ← Back to Search
        </button>
        <h1>Search Results ({searchResults.length} found)</h1>
      </div>

      {searchResults.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Zip</th>
                <th>Owner Name</th>
                <th>Estimated Value</th>
                <th>Property Type</th>
                <th>Bedrooms</th>
                <th>Bathrooms</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((property, index) => (
                <tr key={index}>
                  <td
                    className="clickable-address"
                    onClick={() => handleAddressClick(property)}
                  >
                    {property["Property Address"] || 'N/A'}
                  </td>
                  <td>{property["City"] || 'N/A'}</td>
                  <td>{property["State"] || 'N/A'}</td>
                  <td>{property["Zip"] || 'N/A'}</td>
                  <td>{property["Owner First Name"] && property["Owner Last Name"] ?
                    `${property["Owner First Name"]} ${property["Owner Last Name"]}` :
                    property["Owner First Name"] || property["Owner Last Name"] || 'N/A'}
                  </td>
                  <td>{property["Est. Value"] !== "-" ? property["Est. Value"] : 'N/A'}</td>
                  <td>{property["Property Type"] !== "-" ? property["Property Type"] : 'N/A'}</td>
                  <td>{property["Bedrooms"] !== "-" ? property["Bedrooms"] : 'N/A'}</td>
                  <td>{property["Bathrooms"] !== "-" ? property["Bathrooms"] : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-results">
          <p>No properties found for your search. Try a different zip code.</p>
        </div>
      )}
    </>
  );

  const renderDetailsView = () => {
    if (!selectedProperty) return null;

    const formatValue = (value) => {
      if (!value || value === "-" || value === "") return 'N/A';
      return String(value);
    };

    const sections = [
      {
        title: 'Property Information',
        fields: [
          { label: 'Address', key: 'Property Address' },
          { label: 'City', key: 'City' },
          { label: 'State', key: 'State' },
          { label: 'Zip Code', key: 'Zip' },
          { label: 'County', key: 'County' },
          { label: 'Property Type', key: 'Property Type' },
          { label: 'APN', key: 'APN' }
        ]
      },
      {
        title: 'Owner Information',
        fields: [
          { label: 'Owner First Name', key: 'Owner First Name' },
          { label: 'Owner Last Name', key: 'Owner Last Name' },
          { label: 'Phone Numbers', key: 'Phone Numbers' },
          { label: 'Emails', key: 'Emails' },
          { label: 'Owner Occupied', key: 'Owner Occupied' }
        ]
      },
      {
        title: 'Mailing Address',
        fields: [
          { label: 'Mailing Address', key: 'Mailing Address' },
          { label: 'Mailing City', key: 'Mailing City' },
          { label: 'Mailing State', key: 'Mailing State' },
          { label: 'Mailing Zip Code', key: 'Mailing Zip Code' },
          { label: 'Mailing County', key: 'Mailing County' }
        ]
      },
      {
        title: 'Property Details',
        fields: [
          { label: 'Bedrooms', key: 'Bedrooms' },
          { label: 'Bathrooms', key: 'Bathrooms' },
          { label: 'Property Sqft', key: 'Property Sqft' },
          { label: 'Lot Size', key: 'Lot Size' },
          { label: 'Year Built', key: 'Year Build' }
        ]
      },
      {
        title: 'Financial Information',
        fields: [
          { label: 'Estimated Value', key: 'Est. Value' },
          { label: 'Assessed Value', key: 'Assessed Value' },
          { label: 'Last Sale Date', key: 'Last Sale Date' },
          { label: 'Last Sale Amount', key: 'Last Sale Amount' },
          { label: 'Total Loan Balance', key: 'Total Loan Balance' },
          { label: 'Estimated Equity', key: 'Est. Equity' },
          { label: 'Estimated LTV', key: 'Est. LTV' }
        ]
      },
      {
        title: 'Status Information',
        fields: [
          { label: 'Vacancy', key: 'Vacancy' },
          { label: 'MLS Status', key: 'MLS Status' },
          { label: 'Probate', key: 'Probate' },
          { label: 'Liens', key: 'Liens' },
          { label: 'Pre-Foreclosure', key: 'Pre-Foreclosure' },
          { label: 'Taxes', key: 'Taxes' },
          { label: 'Vacant', key: 'Vacant' }
        ]
      }
    ];

    return (
      <>
        <div className="header-with-back">
          <button onClick={handleBackToResults} className="back-btn">
            ← Back to Results
          </button>
          <h1>Property Details</h1>
        </div>

        <div className="property-summary">
          <h3>{selectedProperty["Property Address"]}, {selectedProperty["City"]}, {selectedProperty["State"]} {selectedProperty["Zip"]}</h3>
          {selectedProperty["Est. Value"] !== "-" && (
            <p><strong>Estimated Value:</strong> {selectedProperty["Est. Value"]}</p>
          )}
        </div>

        <div className="street-view-section">
          <h4>Street View</h4>
          {streetViewLoading && (
            <div className="street-view-loading">
              <p>Loading street view image...</p>
            </div>
          )}
          {streetViewError && (
            <div className="street-view-error">
              <p>{streetViewError}</p>
            </div>
          )}
          {streetViewImage && !streetViewLoading && (
            <div className="street-view-container">
              <img
                src={streetViewImage}
                alt={`Street view of ${selectedProperty["Property Address"]}`}
                className="street-view-image"
              />
            </div>
          )}
        </div>

        <div className="property-details">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="details-section">
              <h4>{section.title}</h4>
              <div className="details-grid">
                {section.fields.map((field, index) => (
                  <div key={index} className="detail-item">
                    <strong>{field.label}:</strong>
                    <span>{formatValue(selectedProperty[field.key])}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="App">
      <div className="container">
        {currentView === 'search' && renderSearchView()}
        {currentView === 'results' && renderResultsView()}
        {currentView === 'details' && renderDetailsView()}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
