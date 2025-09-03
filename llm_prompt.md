# LLM Prompt: React App Property Search UI Modification

## Task Overview
Modify the existing React application to create a new property search interface that integrates with the BatchData API. Replace the current dropdown-based UI with a clean, minimal property search system.

## Current Codebase Context

### Technology Stack
- React 18.2.0 with functional components and hooks
- Axios for HTTP requests
- Standard Create React App setup
- Existing CSS styling with responsive design

### Current App Structure
- `src/App.js`: Main component with dropdown selection and table display
- `src/App.css`: Comprehensive styling with responsive breakpoints
- `package.json`: Includes axios dependency
- Environment variables for API configuration

### Existing Features to Preserve
- Loading states and error handling patterns
- Responsive design breakpoints
- Clean CSS styling approach
- Axios configuration with headers

## Requirements

### 1. New Search Interface
Replace the current dropdown UI with:
- A search input field for city or zip code entry
- A submit button to trigger the search
- Clean, minimal design following existing CSS patterns

### 2. Property Search API Integration
Implement API call to `api.batchdata.com/api/v1/property/search` with:
```json
{
  "searchCriteria": {
    "query": "<user_search_input>"
  },
  "options": {
    "skip": 0,
    "take": 50
  }
}
```

### 3. Search Results Display
- Display results in a table format similar to existing table structure
- Make each address clickable
- Show relevant property information in columns

### 4. Property Details View
When an address is clicked:
- Make API call to `/api/v1/property/lookup/all-attributes`
- Request body format:
```json
{
  "address": {
    "street": "<street_address>",
    "city": "<city>", 
    "state": "<state>",
    "zip": "<zip_code>"
  }
}
```
- Display detailed property information

## Implementation Guidelines

### Code Quality Requirements
- **Clean, minimal code**: Follow existing patterns, avoid over-engineering
- **MVP approach**: Simple, functional implementation without unnecessary features
- **Maintain existing patterns**: Use similar state management and component structure
- **Preserve styling**: Adapt existing CSS classes, maintain responsive design

### State Management
Modify existing state structure:
- Replace `dropdownOptions` and `selectedOption` with search-related state
- Keep `tableData`, `loading`, and `error` state patterns
- Add state for property details view

### API Configuration
- Update API base URL to `api.batchdata.com`
- Maintain existing axios configuration pattern
- Preserve error handling approach

### UI/UX Considerations
- Maintain clean, professional appearance
- Ensure responsive design works on mobile
- Provide clear loading and error states
- Make address clickability obvious (hover states, cursor pointer)

## Specific Implementation Tasks

1. **Remove dropdown logic** from App.js and replace with search input
2. **Update API endpoints** to use BatchData API
3. **Modify table structure** to display property search results
4. **Add click handlers** for address selection
5. **Implement property details view** with all-attributes API call
6. **Update CSS** to accommodate new UI elements while maintaining design consistency
7. **Test responsive behavior** on different screen sizes

## Success Criteria
- Search input accepts city or zip code
- Search triggers correct API call with proper request format
- Results display in clean table format
- Address clicks navigate to detailed view
- All-attributes API integration works correctly
- UI remains responsive and accessible
- Error states provide helpful feedback
- Loading states prevent multiple requests

## Notes
- Do not implement pagination initially (MVP approach)
- Focus on core functionality over advanced features
- Maintain existing code organization and file structure
- Ensure backward compatibility with existing environment variable configuration