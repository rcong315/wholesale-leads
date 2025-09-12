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

  const API_URL = process.env.REACT_APP_API_URL;

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a zip code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}/api/scrape/${searchQuery.trim()}`,
        {},
        axiosConfig
      );
      
      const results = response.data.leads || [];
      setSearchResults(results);
      setCurrentView('results');
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

  const handleAddressClick = (property) => {
    setSelectedProperty(property);
    setCurrentView('details');
  };

  const handleBackToSearch = () => {
    setCurrentView('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProperty(null);
    setError(null);
  };
  
  const handleBackToResults = () => {
    setCurrentView('results');
    setSelectedProperty(null);
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
