import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('search'); // 'search', 'results', 'details'

  // API configuration
  const API_URL = 'https://api.batchdata.com';
  const BEARER_TOKEN = process.env.REACT_APP_BEARER_TOKEN || process.env.REACT_APP_AUTH_TOKEN;

  // Configure axios defaults
  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Add Bearer token if available
  if (BEARER_TOKEN) {
    axiosConfig.headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a city or zip code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Searching for:', searchQuery.trim());
      console.log('API URL:', `${API_URL}/api/v1/property/search`);
      console.log('Request config:', axiosConfig);
      
      const response = await axios.post(
        `${API_URL}/api/v1/property/search`,
        {
          searchCriteria: {
            query: searchQuery.trim()
          },
          options: {
            skip: 0,
            take: 50
          }
        },
        axiosConfig
      );
      
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      const results = response.data.results.properties;
      console.log('Processed results:', results);
      
      setSearchResults(results);
      setCurrentView('results');
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
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

  const handleAddressClick = (property) => {
    if (!property) return;
    
    setSelectedProperty(property);
    setPropertyDetails(property);
    setCurrentView('details');
  };

  const handleBackToSearch = () => {
    setCurrentView('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProperty(null);
    setPropertyDetails(null);
    setError(null);
  };
  
  const handleBackToResults = () => {
    setCurrentView('results');
    setSelectedProperty(null);
    setPropertyDetails(null);
    setError(null);
  };

  const renderSearchView = () => (
    <>
      <h1>Property Search</h1>
      <div className="controls">
        <div className="search-container">
          <label htmlFor="search-input">Enter City or Zip Code:</label>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., Los Angeles, CA or 90210"
            disabled={loading}
          />
        </div>
        <button 
          onClick={handleSearch} 
          disabled={loading || !searchQuery.trim()}
          className="submit-btn"
        >
          {loading ? 'Searching...' : 'Search Properties'}
        </button>
      </div>
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
                <th>Year Built</th>
                <th>Estimated Value</th>
                <th>Sq Ft</th>
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
                    {property.address?.street || 'N/A'}
                  </td>
                  <td>{property.address?.city || 'N/A'}</td>
                  <td>{property.address?.state || 'N/A'}</td>
                  <td>{property.address?.zip || 'N/A'}</td>
                  <td>{property.building?.yearBuilt || 'N/A'}</td>
                  <td>${property.valuation?.estimatedValue?.toLocaleString() || 'N/A'}</td>
                  <td>{property.building?.livingAreaSquareFeet?.toLocaleString() || 'N/A'}</td>
                  <td>{property.building?.roomCount || 'N/A'}</td>
                  <td>{property.building?.bathroomCount || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-results">
          <p>No properties found for your search. Try a different city or zip code.</p>
        </div>
      )}
    </>
  );

  const renderDetailsView = () => {
    if (!propertyDetails) return null;

    const formatValue = (value) => {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'number' && value > 1000) return value.toLocaleString();
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    };

    const sections = [
      {
        title: 'Property Address',
        data: propertyDetails.address || {}
      },
      {
        title: 'Valuation',
        data: propertyDetails.valuation || {}
      },
      {
        title: 'Building Details',
        data: propertyDetails.building || {}
      },
      {
        title: 'Assessment',
        data: propertyDetails.assessment || {}
      },
      {
        title: 'Owner Information',
        data: propertyDetails.owner || {}
      },
      {
        title: 'Property Characteristics',
        data: propertyDetails.general || {}
      },
      {
        title: 'Lot Information',
        data: propertyDetails.lot || {}
      },
      {
        title: 'Tax Information',
        data: propertyDetails.tax || {}
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
        
        {selectedProperty && (
          <div className="property-summary">
            <h3>{propertyDetails.address?.street}, {propertyDetails.address?.city}, {propertyDetails.address?.state} {propertyDetails.address?.zip}</h3>
            <p><strong>Estimated Value:</strong> ${propertyDetails.valuation?.estimatedValue?.toLocaleString() || 'N/A'}</p>
          </div>
        )}
        
        <div className="property-details">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="details-section">
              <h4>{section.title}</h4>
              <div className="details-grid">
                {Object.entries(section.data).map(([key, value], index) => (
                  <div key={index} className="detail-item">
                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                    <span>{formatValue(value)}</span>
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
