const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const tableBody = document.getElementById("countryTableBody");
const message = document.getElementById("message");
const emptyMessage = document.getElementById("emptyMessage");
const totalCountriesElement = document.getElementById("totalCountries");
const countriesAbove5MElement = document.getElementById("countriesAbove5M");
const countriesBelow5MElement = document.getElementById("countriesBelow5M");
const favoriteCountElement = document.getElementById("favoriteCount");

const countryModal = document.getElementById("countryModal");
const closeModal = document.getElementById("closeModal");
const modalFlag = document.getElementById("modalFlag");
const modalName = document.getElementById("modalName");
const modalCapital = document.getElementById("modalCapital");
const modalPopulation = document.getElementById("modalPopulation");
const modalRegion = document.getElementById("modalRegion");
const modalSubregion = document.getElementById("modalSubregion");
const modalLanguages = document.getElementById("modalLanguages");

const minPopulationInput = document.getElementById("minPopulation");
const maxPopulationInput = document.getElementById("maxPopulation");
const applyFilterBtn = document.getElementById("applyFilterBtn");
const resetFilterBtn = document.getElementById("resetFilterBtn");
const populationFilterMessage = document.getElementById("populationFilterMessage");

const nameArrow = document.getElementById("nameArrow");
const populationArrow = document.getElementById("populationArrow");


let selectedCountries = [];
let favoriteCountries =
    new Set(
        JSON.parse(
            localStorage.getItem("favoriteCountries") || "[]"
        )
    );

let currentSort = {
    column: null,
    direction: "asc"
};

let populationFilter = {
    min: null,
    max: null
};

const countriesPerPage = 5;
let currentPage = 1;

const API_KEY = "rc_live_696f2939008b4f2fa0feac6a071f04af";

const API_URL = "https://api.restcountries.com/countries/v5";


const pagination = document.createElement("div");

pagination.classList.add("pagination");

pagination.innerHTML = `
    <button id="previousPage" class="page-btn" aria-label="Previous page">
        ←
    </button>

    <span id="pageInfo">Page 1</span>

    <button id="nextPage" class="page-btn" aria-label="Next page">
        →
    </button>
`;


const tableSection = document.querySelector(".table-section");

tableSection.appendChild(pagination);


const previousPageBtn = document.getElementById("previousPage");

const nextPageBtn = document.getElementById("nextPage");

const pageInfo = document.getElementById("pageInfo");


searchBtn.addEventListener("click", searchCountries);

closeModal.addEventListener(
    "click",
    closeCountryModal
);

countryModal.addEventListener(
    "click",
    function (event) {

        if (event.target === countryModal) {
            closeCountryModal();
        }
    }
);

applyFilterBtn.addEventListener(
    "click",
    applyPopulationFilter
);

resetFilterBtn.addEventListener(
    "click",
    resetPopulationFilter
);


searchInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        searchCountries();
    }
});

document.querySelectorAll(".sort-btn").forEach(function (button) {

    button.addEventListener("click", function () {

        const column = button.dataset.sort;

        sortCountries(column);
    });
});

previousPageBtn.addEventListener("click", function () {

    if (currentPage > 1) {

        currentPage--;

        renderTable();
    }
});

nextPageBtn.addEventListener("click", function () {

    const totalPages =
        Math.ceil(
            selectedCountries.length / countriesPerPage
        );

    if (currentPage < totalPages) {

        currentPage++;

        renderTable();
    }
});


function getCountryId(country) {
    return (
        country.codes?.cca3 ||
        country.codes?.cca2 ||
        country.cca3 ||
        country.cca2 ||
        country.names?.common ||
        country.name?.common
    );
}


async function loadStatistics() {
    try {
        const limit = 100;
        let offset = 0;
        let totalCountries = 0;
        let allCountries = [];
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(
                `${API_URL}?limit=${limit}&offset=${offset}`,
                {
                    headers: {
                        Authorization: `Bearer ${API_KEY}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load country statistics"
                );
            }

            const data = await response.json();

            const countries = data.data?.objects || [];

            if (offset === 0) {
                totalCountries =
                    data.data?.meta?.total ||
                    countries.length;
            }

            allCountries = allCountries.concat(countries);

            hasMore = data.data?.meta?.more === true;

            offset += limit;
        }

        const above5M =
            allCountries.filter(function (country) {
                return (
                    (country.population || 0) >=
                    5000000
                );
            }).length;

        const below5M =
            allCountries.filter(function (country) {
                return (
                    (country.population || 0) <
                    5000000
                );
            }).length;

        totalCountriesElement.textContent = totalCountries;

        countriesAbove5MElement.textContent = above5M;

        countriesBelow5MElement.textContent = below5M;

        updateFavoriteCount();

    } catch (error) {
        console.error(
            "Statistics error:",
            error
        );

        totalCountriesElement.textContent = "—";
        countriesAbove5MElement.textContent = "—";
        countriesBelow5MElement.textContent = "—";
    }
}

function updateFavoriteCount() {
    favoriteCountElement.textContent = favoriteCountries.size;
}

async function searchCountries() {

    const searchTerm =
        searchInput.value.trim();


    searchResults.innerHTML = "";

    message.textContent = "";

    if (!searchTerm) {

        message.textContent = "Please enter a country name.";
        return;
    }


    try {

        searchBtn.disabled = true;
        searchBtn.textContent = "Searching...";

        const url = `${API_URL}?q=${encodeURIComponent(searchTerm)}`;

        const response = await fetch(url, {

            headers: {
                Authorization: `Bearer ${API_KEY}`
            }

        });


        if (!response.ok) {

            throw new Error(
                `API request failed with status ${response.status}`
            );
        }


        const data = await response.json();

        const countries = data.data?.objects || [];


        if (countries.length === 0) {

            message.textContent = "No countries found.";

            return;
        }


        displaySearchResults(countries);


    } catch (error) {

        console.error(
            "Country API error:",
            error
        );

        message.textContent = "Unable to find countries. Please try again.";


    } finally {

        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
}

function displaySearchResults(countries) {

    searchResults.innerHTML = "";


    countries.forEach(function (country) {

        const button = document.createElement("button");


        button.classList.add(
            "country-option"
        );

        const flag = document.createElement("img");

        flag.classList.add(
            "search-flag"
        );

        flag.src = getFlagUrl(country);
        flag.alt = `${country.names?.common || "Country"} flag`;


        const countryInfo = document.createElement("div");


        countryInfo.classList.add(
            "country-option-info"
        );


        const name = document.createElement("strong");


        name.textContent =
            country.names?.common ||
            "Unknown country";


        const population = document.createElement("small");


        population.textContent = `Population: ${(country.population || 0).toLocaleString()}`;


        countryInfo.appendChild(name);
        countryInfo.appendChild(population);

        const arrow = document.createElement("span");


        arrow.classList.add(
            "result-arrow"
        );


        arrow.textContent = "→";


        button.appendChild(flag);
        button.appendChild(countryInfo);
        button.appendChild(arrow);


        button.addEventListener(
            "click",
            function () {

                addCountry(country);
            }
        );


        searchResults.appendChild(button);
    });
}

function addCountry(country) {

    const countryName =
        country.names?.common ||
        "Unknown country";


    const alreadySelected =
        selectedCountries.some(
            function (selectedCountry) {

                return (
                    selectedCountry.names?.common ===
                    countryName
                );
            }
        );


    if (alreadySelected) {

        message.textContent =  `${countryName} is already in the table.`;

        return;
    }


    selectedCountries.push(country);


    currentPage = 1;


    searchInput.value = "";


    searchResults.innerHTML = "";


    message.textContent = "";


    renderTable();
}

function renderTable() {

    tableBody.innerHTML = "";

    if (selectedCountries.length === 0) {

        emptyMessage.style.display = "block";

        pagination.style.display = "none";

        return;
    }


    emptyMessage.style.display = "none";


    const filteredCountries = selectedCountries.filter(function (country) {
        const population = country.population || 0;

        if (
            populationFilter.min !== null &&
            population < populationFilter.min
        ) {
            return false;
        }

        if (
            populationFilter.max !== null &&
            population > populationFilter.max
        ) {
            return false;
        }

        return true;
    });

    const totalPages = Math.ceil(filteredCountries.length / countriesPerPage);

    if (currentPage > totalPages) {

        currentPage = totalPages;
    }


    const startIndex = (currentPage - 1) * countriesPerPage;

    const endIndex = startIndex + countriesPerPage;

    const countriesToDisplay = filteredCountries.slice(startIndex, endIndex);

    countriesToDisplay.forEach(
        function (country) {

            const row = document.createElement("tr");

            row.addEventListener(
                "click",
                function () {
                    openCountryModal(country);
                }
            );

            const population = country.population || 0;

            if (population < 5000000) {

                row.classList.add(
                    "low-population"
                );

            } else {

                row.classList.add(
                    "high-population"
                );
            }

            const flagCell = document.createElement("td");


            const flag = document.createElement("img");

            flag.classList.add(
                "table-flag"
            );

            flag.src = getFlagUrl(country);
            flag.alt = `${country.names?.common || "Country"} flag`;


            flagCell.appendChild(flag);

            const nameCell = document.createElement("td");


            nameCell.textContent =
                country.names?.common ||
                "Unknown country";

            const populationCell = document.createElement("td");

            const favoriteCell = document.createElement("td");

            const favoriteButton = document.createElement("button");

            favoriteButton.classList.add(
                "favorite-btn"
            );

            const countryId = getCountryId(country);

            const isFavorite = favoriteCountries.has(countryId);

            favoriteButton.textContent = isFavorite ? "★ Favorite" : "☆ Favorite";

            if (isFavorite) {
                favoriteButton.classList.add("active");
            }

            favoriteButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    const id =
                        getCountryId(country);

                    if (favoriteCountries.has(id)) {
                        favoriteCountries.delete(id);
                    } else {
                        favoriteCountries.add(id);
                    }

                    localStorage.setItem(
                        "favoriteCountries",
                        JSON.stringify(
                            Array.from(favoriteCountries)
                        )
                    );

                    updateFavoriteCount();
                    renderTable();
                }
            );

            favoriteCell.appendChild(favoriteButton);

            populationCell.textContent = population.toLocaleString();

            row.appendChild(flagCell);
            row.appendChild(nameCell);
            row.appendChild(populationCell);
            row.appendChild(favoriteCell);


            tableBody.appendChild(row);
        }
    );

    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages}`;


    previousPageBtn.disabled =
        currentPage === 1;


    nextPageBtn.disabled =
        currentPage === totalPages;


    if (totalPages <= 1) {
        pagination.style.display = "none";
    } else {
        pagination.style.display = "flex";
    }
}

function sortCountries(column) {

    if (currentSort.column === column) {

        currentSort.direction =
            currentSort.direction === "asc"
                ? "desc"
                : "asc";

    } else {

        currentSort.column = column;

        currentSort.direction = "asc";
    }


    selectedCountries.sort(
        function (a, b) {
            if (column === "name") {

                const nameA =
                    a.names?.common
                        ?.toLowerCase() || "";


                const nameB =
                    b.names?.common
                        ?.toLowerCase() || "";


                if (
                    currentSort.direction === "asc"
                ) {

                    return nameA.localeCompare(
                        nameB
                    );

                } else {

                    return nameB.localeCompare(
                        nameA
                    );
                }
            }

            if (column === "population") {

                const populationA = a.population || 0;


                const populationB = b.population || 0;


                if (
                    currentSort.direction === "asc"
                ) {

                    return (
                        populationA -
                        populationB
                    );

                } else {

                    return (populationB - populationA);
                }
            }


            return 0;
        }
    );

    currentPage = 1;

    updateSortArrows();

    renderTable();
}

function updateSortArrows() {

    nameArrow.textContent = "";

    populationArrow.textContent = "";


    if (currentSort.column === "name") {

        nameArrow.textContent =
            currentSort.direction === "asc"
                ? " ↑"
                : " ↓";
    }


    if (
        currentSort.column === "population"
    ) {

        populationArrow.textContent =
            currentSort.direction === "asc"
                ? " ↑"
                : " ↓";
    }
}

function getFlagUrl(country) {
    return country.flag?.url_svg || country.flag?.url_png || "";
}

function openCountryModal(country) {
    const name =
        country.names?.common ||
        country.name?.common ||
        "N/A";

    const rawCapital = country.capital || country.capitals || country.capitalInfo?.capital;

    let capital = "N/A";
    if (Array.isArray(rawCapital) && rawCapital.length > 0) {
        capital = rawCapital.map(c => typeof c === "string" ? c : c?.name || "").filter(Boolean).join(", ") || "N/A";
    } else if (typeof rawCapital === "string" && rawCapital.trim()) {
        capital = rawCapital;
    } else if (rawCapital && typeof rawCapital === "object") {
        capital = rawCapital.name || rawCapital.common || "N/A";
    }

    const population =
        country.population != null
            ? country.population.toLocaleString()
            : "N/A";

    const region = country.region || "N/A";

    const subregion = country.subregion || "N/A";

    let languages = "N/A";

    if (Array.isArray(country.languages)) {
        languages =
            country.languages
                .map(function (language) {
                    return typeof language === "string"
                        ? language
                        : language?.name || "";
                })
                .filter(Boolean)
                .join(", ") || "N/A";

    } else if (
        country.languages &&
        typeof country.languages === "object"
    ) {
        languages =
            Object.values(country.languages)
                .map(function (language) {
                    if (typeof language === "string") {
                        return language;
                    }

                    return language?.name || "";
                })
                .filter(Boolean)
                .join(", ") || "N/A";
    }

    modalFlag.src = getFlagUrl(country);

    modalFlag.alt = `${name} flag`;

    modalName.textContent = name;

    modalCapital.textContent = capital;

    modalPopulation.textContent = population;

    modalRegion.textContent = region;

    modalSubregion.textContent = subregion;

    modalLanguages.textContent = languages;

    countryModal.style.display = "flex";
}

function closeCountryModal() {
    countryModal.style.display = "none";
}

function applyPopulationFilter() {
    const minValue = minPopulationInput.value.trim();
    const maxValue = maxPopulationInput.value.trim();

    const min = minValue === "" ? null : Number(minValue);

    const max = maxValue === "" ? null : Number(maxValue);

    populationFilterMessage.textContent = "";

    if (
        (min !== null && (Number.isNaN(min) || min < 0)) ||
        (max !== null && (Number.isNaN(max) || max < 0))
    ) {
        populationFilterMessage.textContent = "Population values cannot be negative.";
        return;
    }

    if (
        min !== null &&
        max !== null &&
        min > max
    ) {
        populationFilterMessage.textContent =
            "Minimum population cannot be greater than maximum population.";
        return;
    }

    populationFilter.min = min;
    populationFilter.max = max;

    currentPage = 1;
    renderTable();
}

function resetPopulationFilter() {
    minPopulationInput.value = "";
    maxPopulationInput.value = "";

    populationFilter.min = null;
    populationFilter.max = null;

    populationFilterMessage.textContent = "";

    currentPage = 1;
    renderTable();
}


pagination.style.display = "none";

emptyMessage.style.display = "block";

loadStatistics();
updateFavoriteCount();