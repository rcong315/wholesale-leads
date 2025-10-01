import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

// Configurable filters - modify this object to change available filters
const AVAILABLE_FILTERS = {
  propertyType: {
    label: 'Property Type',
    type: 'select',
    options: ['All', 'Single Family', 'Multi Family', 'Condo', 'Townhouse', 'Land']
  },
  city: {
    label: 'City',
    type: 'text',
    placeholder: 'e.g., Los Angeles'
  },
  minValue: {
    label: 'Min Value',
    type: 'number',
    placeholder: 'e.g., 100000'
  },
  maxValue: {
    label: 'Max Value',
    type: 'number',
    placeholder: 'e.g., 500000'
  },
  minSaleAmount: {
    label: 'Min Last Sale Amount',
    type: 'number',
    placeholder: 'e.g., 100000'
  },
  maxSaleAmount: {
    label: 'Max Last Sale Amount',
    type: 'number',
    placeholder: 'e.g., 500000'
  },
  minLoanBalance: {
    label: 'Min Loan Balance',
    type: 'number',
    placeholder: 'e.g., 50000'
  },
  maxLoanBalance: {
    label: 'Max Loan Balance',
    type: 'number',
    placeholder: 'e.g., 300000'
  },
  minInterestRate: {
    label: 'Min Interest Rate (%)',
    type: 'number',
    placeholder: 'e.g., 3'
  },
  maxInterestRate: {
    label: 'Max Interest Rate (%)',
    type: 'number',
    placeholder: 'e.g., 7'
  },
  mlsStatus: {
    label: 'MLS Status',
    type: 'text',
    placeholder: 'e.g., Active'
  },
  probate: {
    label: 'Probate',
    type: 'select',
    options: ['All', 'Yes', 'No']
  },
  liens: {
    label: 'Liens',
    type: 'select',
    options: ['All', 'Yes', 'No']
  },
  preForeclosure: {
    label: 'Pre-Foreclosure',
    type: 'select',
    options: ['All', 'Yes', 'No']
  },
  taxes: {
    label: 'Taxes Status',
    type: 'text',
    placeholder: 'e.g., Current'
  }
};

// Configurable sorting options - modify this to change available sort options
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'value_asc', label: 'Value: Low to High' },
  { value: 'value_desc', label: 'Value: High to Low' },
  { value: 'city_asc', label: 'City: A to Z' },
  { value: 'city_desc', label: 'City: Z to A' },
  { value: 'last_sale_date_desc', label: 'Last Sale Date: Newest First' },
  { value: 'last_sale_date_asc', label: 'Last Sale Date: Oldest First' },
  { value: 'last_sale_amount_desc', label: 'Last Sale Amount: High to Low' },
  { value: 'last_sale_amount_asc', label: 'Last Sale Amount: Low to High' },
  { value: 'loan_balance_desc', label: 'Loan Balance: High to Low' },
  { value: 'loan_balance_asc', label: 'Loan Balance: Low to High' },
  { value: 'interest_rate_desc', label: 'Interest Rate: High to Low' },
  { value: 'interest_rate_asc', label: 'Interest Rate: Low to High' }
];

function App() {
  const [leads, setLeads] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [streetViewImage, setStreetViewImage] = useState(null);
  const [streetViewLoading, setStreetViewLoading] = useState(false);
  const [streetViewError, setStreetViewError] = useState(null);
  const [streetViewDate, setStreetViewDate] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const leadsPerPage = 50;

  // Filter state - initialize from AVAILABLE_FILTERS
  const [filters, setFilters] = useState({});

  // Sorting state
  const [sortBy, setSortBy] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;

  // Fetch leads from API with pagination, filters, and sorting
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * leadsPerPage;

      // Build filters dict (remove empty values)
      const filtersDict = Object.entries(filters)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});

      // Build request body
      const body = {
        filters: filtersDict,
        offset,
        limit: leadsPerPage
      };

      // Add sorting parameter if set
      if (sortBy) {
        body.sortBy = sortBy;
      }

      const response = await axios.post(`${API_URL}/api/leads`, body, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setLeads(response.data.leads || []);
      setTotalLeads(response.data.total || 0);
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
  }, [currentPage, filters, sortBy, API_URL, leadsPerPage]);

  // Load leads on component mount and when page, filters, or sorting change
  useEffect(() => {
    if (currentView === 'home') {
      fetchLeads();
    }
  }, [currentView, fetchLeads]);

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setSortBy('');
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const fetchStreetViewImage = async (address) => {
    try {
      setStreetViewLoading(true);
      setStreetViewError(null);
      setStreetViewDate(null);

      const response = await axios.get(`${API_URL}/api/street-view/image`, {
        params: { address },
        responseType: 'blob'
      });

      // Create blob URL for the image
      const imageBlob = new Blob([response.data], { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(imageBlob);
      setStreetViewImage(imageUrl);

      // Extract and format the image date from header
      // Note: The backend must include 'X-Image-Date' in Access-Control-Expose-Headers for this to work
      const imageDateHeader = response.headers['x-image-date'] || response.headers['X-Image-Date'];

      if (imageDateHeader) {
        const formattedDate = formatImageDate(imageDateHeader);
        setStreetViewDate(formattedDate);
      }
    } catch (err) {
      console.error('Error fetching street view image:', err);
      setStreetViewError('Failed to load street view image');
    } finally {
      setStreetViewLoading(false);
    }
  };

  // Format YYYY-MM to "Month, YYYY"
  const formatImageDate = (dateString) => {
    try {
      const [year, month] = dateString.split('-');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]}, ${year}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return null;
    }
  };

  const handleAddressClick = (property) => {
    setSelectedProperty(property);
    setCurrentView('details');

    // Clear previous street view data
    setStreetViewImage(null);
    setStreetViewError(null);
    setStreetViewDate(null);

    // Fetch street view image for the address
    const address = `${property["property_address"]}, ${property["city"]}, ${property["state"]} ${property["zip"]}`;
    fetchStreetViewImage(address);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedProperty(null);

    // Clean up street view image URL to prevent memory leaks
    if (streetViewImage) {
      URL.revokeObjectURL(streetViewImage);
      setStreetViewImage(null);
    }
    setStreetViewError(null);
    setStreetViewDate(null);
  };

  const renderHomeView = () => {
    const totalPages = Math.ceil(totalLeads / leadsPerPage);
    const startIndex = (currentPage - 1) * leadsPerPage + 1;
    const endIndex = Math.min(currentPage * leadsPerPage, totalLeads);

    return (
      <>
        <h1>Wholesale Leads ({totalLeads} total)</h1>

        {/* Filters and Sorting Section */}
        <div className="filters-section">
          <div className="filters-header">
            <h3>Filters & Sorting</h3>
            <div className="sort-controls">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filters-grid">
            {Object.entries(AVAILABLE_FILTERS).map(([key, config]) => (
              <div key={key} className="filter-item">
                <label htmlFor={`filter-${key}`}>{config.label}:</label>
                {config.type === 'select' ? (
                  <select
                    id={`filter-${key}`}
                    value={filters[key] || 'All'}
                    onChange={(e) => handleFilterChange(key, e.target.value === 'All' ? '' : e.target.value)}
                  >
                    {config.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`filter-${key}`}
                    type={config.type}
                    placeholder={config.placeholder}
                    value={filters[key] || ''}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="filter-actions">
            <button onClick={handleClearFilters} className="clear-filters-btn">
              Clear All Filters & Sorting
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-message">
            <p>Loading leads...</p>
          </div>
        )}

        {!loading && leads.length > 0 && (
          <>
            <div className="results-info">
              <p>Showing {startIndex} - {endIndex} of {totalLeads} leads (Page {currentPage} of {totalPages})</p>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>City</th>
                    <th>Estimated Value</th>
                    <th>Property Type</th>
                    <th>Last Sale Date</th>
                    <th>Last Sale Amount</th>
                    <th>Total Loan Balance</th>
                    <th>MLS Status</th>
                    <th>Probate</th>
                    <th>Liens</th>
                    <th>Pre-Foreclosure</th>
                    <th>Taxes</th>
                    <th>Loan Interest Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((property, index) => (
                    <tr key={index}>
                      <td
                        className="clickable-address"
                        onClick={() => handleAddressClick(property)}
                      >
                        {property["property_address"] || 'N/A'}
                      </td>
                      <td>{property["city"] || 'N/A'}</td>
                      <td>{property["est_value"] !== "-" ? property["est_value"] : 'N/A'}</td>
                      <td>{property["property_type"] !== "-" ? property["property_type"] : 'N/A'}</td>
                      <td>{property["last_sale_date"] !== "-" ? property["last_sale_date"] : 'N/A'}</td>
                      <td>{property["last_sale_amount"] !== "-" ? property["last_sale_amount"] : 'N/A'}</td>
                      <td>{property["total_loan_balance"] !== "-" ? property["total_loan_balance"] : 'N/A'}</td>
                      <td>{property["mls_status"] !== "-" ? property["mls_status"] : 'N/A'}</td>
                      <td>{property["probate"] !== "-" ? property["probate"] : 'N/A'}</td>
                      <td>{property["liens"] !== "-" ? property["liens"] : 'N/A'}</td>
                      <td>{property["pre_foreclosure"] !== "-" ? property["pre_foreclosure"] : 'N/A'}</td>
                      <td>{property["taxes"] !== "-" ? property["taxes"] : 'N/A'}</td>
                      <td>{property["loan_interest_rate"] !== "-" ? property["loan_interest_rate"] : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>

              <div className="page-numbers">
                {currentPage > 2 && (
                  <>
                    <button onClick={() => handlePageChange(1)} className="page-number">1</button>
                    {currentPage > 3 && <span className="pagination-ellipsis">...</span>}
                  </>
                )}

                {currentPage > 1 && (
                  <button onClick={() => handlePageChange(currentPage - 1)} className="page-number">
                    {currentPage - 1}
                  </button>
                )}

                <button className="page-number active">{currentPage}</button>

                {currentPage < totalPages && (
                  <button onClick={() => handlePageChange(currentPage + 1)} className="page-number">
                    {currentPage + 1}
                  </button>
                )}

                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="pagination-ellipsis">...</span>}
                    <button onClick={() => handlePageChange(totalPages)} className="page-number">
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          </>
        )}

        {!loading && leads.length === 0 && (
          <div className="no-results">
            <p>No leads found. Try adjusting your filters.</p>
          </div>
        )}
      </>
    );
  };


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
          { label: 'Address', key: 'property_address' },
          { label: 'City', key: 'city' },
          { label: 'State', key: 'state' },
          { label: 'Zip Code', key: 'zip' },
          { label: 'County', key: 'county' },
          { label: 'Property Type', key: 'property_type' },
          { label: 'APN', key: 'apn' }
        ]
      },
      {
        title: 'Owner Information',
        fields: [
          { label: 'Owner First Name', key: 'owner_first_name' },
          { label: 'Owner Last Name', key: 'owner_last_name' },
          { label: 'Phone Numbers', key: 'phone_numbers' },
          { label: 'Emails', key: 'emails' },
          { label: 'Owner Occupied', key: 'owner_occupied' }
        ]
      },
      {
        title: 'Mailing Address',
        fields: [
          { label: 'Mailing Address', key: 'mailing_address' },
          { label: 'Mailing City', key: 'mailing_city' },
          { label: 'Mailing State', key: 'mailing_state' },
          { label: 'Mailing Zip Code', key: 'mailing_zip' },
          { label: 'Mailing County', key: 'mailing_county' }
        ]
      },
      {
        title: 'Property Details',
        fields: [
          { label: 'Bedrooms', key: 'bedrooms' },
          { label: 'Bathrooms', key: 'bathrooms' },
          { label: 'Property Sqft', key: 'property_sqft' },
          { label: 'Lot Size', key: 'lot_size' },
          { label: 'Year Built', key: 'year_build' }
        ]
      },
      {
        title: 'Financial Information',
        fields: [
          { label: 'Estimated Value', key: 'est_value' },
          { label: 'Assessed Value', key: 'assessed_value' },
          { label: 'Last Sale Date', key: 'last_sale_date' },
          { label: 'Last Sale Amount', key: 'last_sale_amount' },
          { label: 'Total Loan Balance', key: 'total_loan_balance' },
          { label: 'Estimated Equity', key: 'est_equity' },
          { label: 'Estimated LTV', key: 'est_ltv' }
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
          <button onClick={handleBackToHome} className="back-btn">
            ← Back to Leads
          </button>
          <h1>Property Details</h1>
        </div>

        <div className="property-summary">
          <h3>{selectedProperty["property_address"]}, {selectedProperty["city"]}, {selectedProperty["state"]} {selectedProperty["zip"]}</h3>
          {selectedProperty["est_value"] !== "-" && (
            <p><strong>Estimated Value:</strong> {selectedProperty["est_value"]}</p>
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
                alt={`Street view of ${selectedProperty["property_address"]}`}
                className="street-view-image"
              />
              {streetViewDate && (
                <p className="street-view-date">Image taken: {streetViewDate}</p>
              )}
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
        {currentView === 'home' && renderHomeView()}
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
