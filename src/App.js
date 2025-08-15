import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API configuration
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const API_KEY = process.env.REACT_APP_API_KEY;
  const API_SECRET = process.env.REACT_APP_API_SECRET;
  const AUTH_TOKEN = process.env.REACT_APP_AUTH_TOKEN;

  // Configure axios defaults
  const axiosConfig = {
    headers: {}
  };

  if (API_KEY) {
    axiosConfig.headers['X-API-Key'] = API_KEY;
  }
  if (API_SECRET) {
    axiosConfig.headers['X-API-Secret'] = API_SECRET;
  }
  if (AUTH_TOKEN) {
    axiosConfig.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  // Fetch dropdown options on component mount
  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  const fetchDropdownOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/dropdown-options`, axiosConfig);
      setDropdownOptions(response.data.options || []);
    } catch (err) {
      setError('Failed to fetch dropdown options');
      console.error('Error fetching dropdown options:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError('Please select an option from the dropdown');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}/api/table-data`,
        { selection: selectedOption },
        axiosConfig
      );
      setTableData(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch table data');
      console.error('Error fetching table data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (tableData.length === 0) {
      setError('No data to export');
      return;
    }

    // Get headers from the first object
    const headers = Object.keys(tableData[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    tableData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvContent += values.join(',') + '\n';
    });

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wholesale_leads_${selectedOption}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Wholesale Leads</h1>
        
        <div className="controls">
          <div className="dropdown-container">
            <label htmlFor="options-dropdown">Select Option:</label>
            <select
              id="options-dropdown"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Select an option --</option>
              {dropdownOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={loading || !selectedOption}
            className="submit-btn"
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {tableData.length > 0 && (
          <>
            <div className="export-container">
              <button onClick={exportToCSV} className="export-btn">
                Export to CSV
              </button>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {Object.keys(tableData[0]).map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex}>
                          {value !== null && value !== undefined ? String(value) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
