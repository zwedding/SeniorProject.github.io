// API Key
const apiKey = 'G5p3r5vrSc_5uiWPbpMa00sP3fVvQeZfukEgmC7jgF98iMUbSQaIX5Usci0o-fb1meRcZcIar-lgUux_t_01brds7H2e4oyVjgh68Poyd8fXJ2aHwWzoZnbJQwGsZ3Yx';

// Yelp API Base URL
const yelpApiBaseUrl = 'https://api.yelp.com/v3/businesses/search';

// Sanitize user input using DOMPurify
function sanitizeInput(input) {
    return DOMPurify.sanitize(input);
}

// Function to fetch restaurants based on search criteria
async function fetchRestaurants(criteria) {
    try {
        const response = await fetch(`http://localhost:3000/api/search?` + new URLSearchParams(criteria), {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.businesses || data.businesses.length === 0) {
            throw new Error('No restaurants found matching your criteria.');
        }

        displayRestaurants(data.businesses);

    } catch (error) {
        console.error('Error fetching restaurants:', error);

        const resultsContainer = document.getElementById('restaurant-list') || document.getElementById('restaurant-results');
        resultsContainer.innerHTML = `<p class="error-message">Oops! Something went wrong: ${error.message}</p>`;
    }
}

// Display restaurant results
function displayRestaurants(restaurants) {
    const resultsContainer = document.getElementById('restaurant-list') || document.getElementById('restaurant-results');
    resultsContainer.style.marginTop = '20px';
    resultsContainer.innerHTML = '';

    if (restaurants.length === 0) {
        resultsContainer.innerHTML = '<p>No restaurants found based on your criteria.</p>';
        return;
    }

    const isOnBookPage = window.location.pathname.includes('book.html');

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
                <p><strong>Phone:</strong> ${phone}</p>
            </div>
        `;

        if (isOnBookPage) {
            const bookNowBtn = document.createElement('button');
            bookNowBtn.classList.add('book-now-btn');
            bookNowBtn.innerText = 'Book Now';

            const bookingUrl = reservationUrl || url;

            bookNowBtn.setAttribute('data-url', bookingUrl);
            bookNowBtn.addEventListener('click', function() {
                window.location.href = bookingUrl;
            });

            restaurantElement.appendChild(bookNowBtn);
        }

        resultsContainer.appendChild(restaurantElement);
    });
}

// Get criteria from narrow form and fetch restaurants (Narrow Page)
const searchNarrowBtn = document.getElementById('search-narrow-btn');
if (searchNarrowBtn) {
    searchNarrowBtn.addEventListener('click', function (event) {
        event.preventDefault();

        // Collect the form values for narrowing the search
        const cuisineType = sanitizeInput(document.getElementById('cuisine-type')?.value);
        const location = sanitizeInput(document.getElementById('location')?.value);
        const priceRange = sanitizeInput(document.getElementById('price-range')?.value);
        const minRating = sanitizeInput(document.getElementById('min-rating')?.value);
        const openNow = sanitizeInput(document.getElementById('open-now')?.value);

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
    });
} else {
    console.error('Search button for the narrow page not found!');
}

// Get criteria from book form and fetch restaurants (Book Page)
const searchBookBtn = document.getElementById('search-book-btn');
if (searchBookBtn) {
    searchBookBtn.addEventListener('click', function (event) {
        event.preventDefault();

        const restaurantSearch = sanitizeInput(document.getElementById('restaurant-search')?.value);
        let userLocation = sanitizeInput(document.getElementById('user-location')?.value);

        if (!restaurantSearch) {
            console.log("Please enter a restaurant name.");
            return;
        }

        if (!userLocation) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    userLocation = `${position.coords.latitude},${position.coords.longitude}`;
                    const criteria = {
                        term: restaurantSearch,
                        location: userLocation,
                        limit: 10,
                    };
                    fetchRestaurants(criteria);
                }, function (error) {
                    console.error("Geolocation error:", error);
                    alert("Unable to retrieve your location. Please enter a location manually.");
                });
            } else {
                alert("Geolocation is not supported by your browser.");
            }
        } else {
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