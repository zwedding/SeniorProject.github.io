// API Key
const apiKey = 'CfokFbu3zwZSc6ck9eVx2wMi7QV6WWNDPMx8_oe9wnORvVpVUn7SCFTG5e3qbPDTqr9Cu94rLq6jopJDrPUTMOe_71hC94g92e4EHH16-YRIDoF0UynlYHcV0Pf-Z3Yx';

// Yelp API Base URL
const yelpApiBaseUrl = 'https://api.yelp.com/v3/businesses/search';

// Sanitize user input using DOMPurify
function sanitizeInput(input) {
    return DOMPurify.sanitize(input);
}

let lastApiRequestTime = 0;
const rateLimitPeriod = 5000; // 5 seconds in milliseconds

function canMakeApiRequest() {
  const currentTime = Date.now();
  if (currentTime - lastApiRequestTime >= rateLimitPeriod) {
    lastApiRequestTime = currentTime;
    return true;
  }
  return false;
}

// Function to fetch restaurants based on search criteria
async function fetchRestaurants(criteria) {
    if (!canMakeApiRequest()) {
        alert('Please wait before making another request.');
        return;
      }
    
    try {
        const response = await fetch(yelpApiBaseUrl + '?' + new URLSearchParams(criteria), {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        // Check if the response is ok
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        // If there are no businesses returned...
        if (!data.businesses || data.businesses.length === 0) {
            throw new Error('No restaurants found matching your criteria.');
        }

        // Display restaurant data
        displayRestaurants(data.businesses);

    } catch (error) {
        // Display an error message on the page
        console.error('Error fetching restaurants:', error);

        // Display the error message in the results container
        const resultsContainer = document.getElementById('restaurant-list') || document.getElementById('restaurant-results');
        resultsContainer.innerHTML = `<p class="error-message">Oops! Something went wrong: ${error.message}</p>`;
    }
}

// Display restaurant results
function displayRestaurants(restaurants) {
    const resultsContainer = document.getElementById('restaurant-list') || document.getElementById('restaurant-results');
    resultsContainer.style.marginTop = '20px'; // Add space between the search button and results
    resultsContainer.innerHTML = ''; // Clear previous results

    if (restaurants.length === 0) {
        resultsContainer.innerHTML = '<p>No restaurants found based on your criteria.</p>';
        return;
    }

    // Check if the user is on the 'book.html' page
    const isOnBookPage = window.location.pathname.includes('book.html');

    // Style info
    restaurants.forEach(restaurant => {
        const restaurantElement = document.createElement('div');
        restaurantElement.classList.add('restaurant');
        restaurantElement.style.border = '1px solid #ccc';
        restaurantElement.style.padding = '15px';
        restaurantElement.style.marginBottom = '15px';
        restaurantElement.style.borderRadius = '8px';
        restaurantElement.style.backgroundColor = '#f9f9f9';

        const address = sanitizeInput(restaurant.location.address1 || 'N/A');
        const city = sanitizeInput(restaurant.location.city || 'N/A');
        const state = sanitizeInput(restaurant.location.state || 'N/A');
        const phone = sanitizeInput(restaurant.display_phone || 'N/A');
        const url = sanitizeInput(restaurant.url || '#');
        const reservationUrl = sanitizeInput(restaurant.reservation_url || null);

        restaurantElement.innerHTML = `
            <h3 style="margin-bottom: 5px;">${sanitizeInput(restaurant.name)}</h3>
            <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
                <p><strong>Rating:</strong> ${sanitizeInput(restaurant.rating)} stars</p>
                <p><strong>Price:</strong> ${sanitizeInput(restaurant.price || 'N/A')}</p>
                <p><strong>Location:</strong> ${address}, ${city}, ${state}</p>
                <p><strong>Phone:</strong> ${phone}</p> <!-- Display the phone number -->
            </div>
        `;

        // Only add the "Book Now" button if on the book.html page
        if (isOnBookPage) {
            const bookNowBtn = document.createElement('button');
            bookNowBtn.classList.add('book-now-btn');
            bookNowBtn.innerText = 'Book Now';

            // If a reservation URL is available, use it
            const bookingUrl = reservationUrl || url;

            bookNowBtn.setAttribute('data-url', bookingUrl);

            // Add event listener for the Book Now button
            bookNowBtn.addEventListener('click', function() {
                // Redirect to the booking page or Yelp page
                window.location.href = bookingUrl;
            });

            // Append the "Book Now" button to the restaurant element
            restaurantElement.appendChild(bookNowBtn);
        }

        resultsContainer.appendChild(restaurantElement);
    });
}

// Get criteria from book form and fetch restaurants
const searchBookBtn = document.getElementById('search-book-btn');
if (searchBookBtn) {
    searchBookBtn.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent form submission

        const restaurantSearch = sanitizeInput(document.getElementById('restaurant-search')?.value);
        let userLocation = sanitizeInput(document.getElementById('user-location')?.value);

        // Debugging logs
        console.log("Search button clicked");
        console.log("Restaurant search value:", restaurantSearch);
        console.log("User location:", userLocation);

        if (!restaurantSearch) {
            alert("Please enter a restaurant name.");
            return;
        }

        // If location is empty, use geolocation to get user's location
        if (!userLocation) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    userLocation = `${position.coords.latitude},${position.coords.longitude}`;
                    // Collect criteria
                    const criteria = {
                        term: restaurantSearch,
                        location: userLocation,
                        limit: 10,
                    };
                    // Fetch restaurants
                    fetchRestaurants(criteria);
                }, function (error) {
                    console.error("Geolocation error:", error);
                    // Handle the case where geolocation fails
                    alert("Unable to retrieve your location. Please enter a location manually.");
                });
            } else {
                alert("Geolocation is not supported by your browser.");
            }
        } else {
            // Collect criteria
            const criteria = {
                term: restaurantSearch,
                location: userLocation,
                limit: 10,
            };
            fetchRestaurants(criteria);
        }
    });
} else {
    console.error('Search button for the book page not found!');
}

const searchNarrowBtn = document.getElementById('search-narrow-btn');
if (searchNarrowBtn) {
    searchNarrowBtn.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent form submission

        // Collect form values
        const cuisineType = sanitizeInput(document.getElementById('cuisine-type')?.value);
        let location = sanitizeInput(document.getElementById('location')?.value);
        const priceRange = sanitizeInput(document.getElementById('price-range')?.value);
        const minRating = sanitizeInput(document.getElementById('min-rating')?.value);
        const openNow = sanitizeInput(document.getElementById('open-now')?.value);

        // If location is empty, get user's location
        if (!location) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        location = `${position.coords.latitude},${position.coords.longitude}`;

                        const criteria = {
                            term: cuisineType !== 'all' ? cuisineType : '',
                            location: location,
                            price: priceRange,
                            rating: minRating,
                            open_now: openNow === 'true',
                            categories: cuisineType !== 'all' ? cuisineType : undefined,
                            limit: 10,
                        };

                        fetchRestaurants(criteria);
                    },
                    function (error) {
                        console.error("Geolocation error:", error);
                        alert("Unable to retrieve your location. Please enter a location manually.");
                    }
                );
            } else {
                alert("Geolocation is not supported by your browser.");
            }
        } else {
            const criteria = {
                term: cuisineType !== 'all' ? cuisineType : '',
                location: location,
                price: priceRange,
                rating: minRating,
                open_now: openNow === 'true',
                categories: cuisineType !== 'all' ? cuisineType : undefined,
                limit: 10,
            };

            fetchRestaurants(criteria);
        }
    });
} else {
    console.error('Search button for the narrow page not found!');
}