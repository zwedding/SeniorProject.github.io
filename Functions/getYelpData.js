const fetch = require('node-fetch');

exports.handler = async function(event) {
  const API_KEY = process.env.YELP_API_KEY; // Securely access API key

  // Get parameters from the frontend request (if needed)
  const { location, term } = event.queryStringParameters;

  // Construct the Yelp API URL
  const yelpURL = `https://api.yelp.com/v3/businesses/search?location=${location}&term=${term}`;

  try {
    const response = await fetch(yelpURL, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch data" })
    };
  }
};