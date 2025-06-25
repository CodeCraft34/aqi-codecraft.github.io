// --- Configuration ---
const WAQI_API_TOKEN = '0851ddcb5d1274b9903e88000452ecff17e41ea5';
const WAQI_BASE_URL = 'https://api.waqi.info/feed/';

// --- DOM Elements ---
const htmlElement = document.documentElement

const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');
const cityAqiCardContainer = document.getElementById('cityAqiCardContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');

// Burger menu and theme toggle elements
const burgerMenuToggle = document.querySelector('.burger-menu-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const aboutUsSection = document.getElementById('about-us-section');
const themeToggle = document.getElementById('themeToggle');
const sunIcon = themeToggle.querySelector('.fa-sun');
const moonIcon = themeToggle.querySelector('.fa-moon');


// --- Helper Functions ---

function showElement(element, message = '') {
    element.textContent = message;
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

// Function to clear display and hide other sections
function clearMainContent() {
    cityAqiCardContainer.innerHTML = '';
    hideElement(cityAqiCardContainer);
    hideElement(errorMessage);
    hideElement(aboutUsSection);
    hideElement(loadingIndicator);
}

// Function to map AQI value to status and CSS class
function getAqiStatus(aqi) {
    if (aqi <= 50) return { class: 'good', text: 'Good' };
    if (aqi <= 100) return { class: 'moderate', text: 'Moderate' };
    if (aqi <= 150) return { class: 'usg', text: 'Unhealthy for Sensitive Groups' };
    if (aqi <= 200) return { class: 'unhealthy', text: 'Unhealthy' };
    if (aqi <= 300) return { class: 'very-unhealthy', text: 'Very Unhealthy' };
    if (aqi > 300) return { class: 'hazardous', text: 'Hazardous' };
    return { class: '', text: 'N/A' };
}

/**
 * Renders a single AQI card.
 * @param {string} searchedCityName - The city name the user typed.
 * @param {object} aqiData - The data object received from the WAQI API (data.data).
 */
function renderAqiCard(searchedCityName, aqiData) {
    clearMainContent(); // Clear other content before showing card
    showElement(cityAqiCardContainer, ''); // Show the container

    const aqi = aqiData.aqi;
    const apiCityName = aqiData.city.name; // This is what the API returned (e.g., "India")
    const timeString = aqiData.time.s;
    const dominentPol = aqiData.dominentpol || 'N/A';

    const status = getAqiStatus(aqi);

    // Helper to safely get pollutant values
    const getPollutantValue = (pollutant) => aqiData.iaqi[pollutant] ? aqiData.iaqi[pollutant].v : 'N/A';

    const pm25Value = getPollutantValue('pm25');
    const pm10Value = getPollutantValue('pm10');
    const ozoneValue = getPollutantValue('o3');
    const no2Value = getPollutantValue('no2');
    const coValue = getPollutantValue('co');
    const so2Value = getPollutantValue('so2');

    const cardHTML = `
        <div class="aqi-card ${status.class}">
            <h2>${searchedCityName}</h2> <p class="aqi-value">AQI: ${aqi}</p>
            <p class="status">${status.text}</p>
            <div class="details">
                <p>Dominant Pollutant: ${dominentPol.toUpperCase()}</p>
                <p>PM2.5: ${pm25Value} µg/m³</p>
                <p>PM10: ${pm10Value} µg/m³</p>
                <p>Ozone (O3): ${ozoneValue} ppb</p>
                <p>Nitrogen Dioxide (NO2): ${no2Value} ppb</p>
                <p>Carbon Monoxide (CO): ${coValue} ppb</p>
                <p>Sulfur Dioxide (SO2): ${so2Value} ppb</p>
                <p>Last Updated: ${timeString}</p>
                <p class="data-source-note">Data for: ${apiCityName}</p>
            </div>
        </div>
    `;
    cityAqiCardContainer.insertAdjacentHTML('beforeend', cardHTML);
}

// Main function to handle city search and display AQI from WAQI API
async function searchCityAqi() {
    const cityName = cityInput.value.trim(); // Capture the user's typed city name
    if (!cityName) {
        clearMainContent();
        showElement(errorMessage, 'Please enter a city name.');
        return;
    }

    clearMainContent();
    showElement(loadingIndicator, `Fetching AQI data for ${cityName}...`);

    try {
        const url = `${WAQI_BASE_URL}${encodeURIComponent(cityName)}/?token=${WAQI_API_TOKEN}`;

        const response = await fetch(url);

        if (!response.ok) {
            let errorText = `HTTP error! Status: ${response.status}`;
            try {
                const errorJson = await response.json();
                if (errorJson && errorJson.data && typeof errorJson.data === 'string') {
                    errorText = errorJson.data;
                }
            } catch (jsonError) { /* non-JSON response */ }
            throw new Error(errorText);
        }

        const data = await response.json();

        if (data.status === 'ok' && data.data && data.data.aqi) {
            // Pass both the searched city name and the API's data
            renderAqiCard(cityName, data.data);
        } else {
            let customError = data.data || `Could not find AQI data for "${cityName}". Please check the city name or try a nearby major city.`;
            throw new Error(customError);
        }
    } catch (error) {
        console.error('Error fetching AQI:', error);
        clearMainContent();
        showElement(errorMessage, `Failed to get AQI: ${error.message}`);
    } finally {
        hideElement(loadingIndicator);
        cityInput.value = '';
    }
}

// --- Burger Menu Functions ---
function toggleBurgerMenu() {
    htmlElement.classList.toggle('menu-open');
    htmlElement.classList.toggle('no-scroll');
}

function closeBurgerMenu() {
    htmlElement.classList.remove('menu-open');
    htmlElement.classList.remove('no-scroll');
}

// --- Theme Switching Functions ---
function applyTheme(theme) {
    if (theme === 'light') {
        htmlElement.classList.add('light-theme');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        htmlElement.classList.remove('light-theme');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = htmlElement.classList.contains('light-theme') ? 'light' : 'dark';
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// --- Event Listeners ---
searchButton.addEventListener('click', searchCityAqi);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchCityAqi();
    }
});

// Burger menu event listener
burgerMenuToggle.addEventListener('click', toggleBurgerMenu);

// Close burger menu and handle navigation when a nav link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        closeBurgerMenu(); // Close menu on link click

        const targetHref = event.target.getAttribute('href');
        if (targetHref === '#home') {
            event.preventDefault();
            clearMainContent();
            searchCityAqi(); // Re-trigger default city search for home
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (targetHref === '#about-us-section') {
            event.preventDefault();
            clearMainContent();
            showElement(aboutUsSection, ''); // Show About Us section
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});

// Theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);


// --- Initial Load Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Initial AQI search for a default city (e.g., 'Durgapur')
    cityInput.value = 'Durgapur'; // Set the input value
    searchCityAqi(); // Trigger the search
});