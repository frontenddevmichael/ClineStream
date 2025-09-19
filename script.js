// Replace with your actual TMDb API key
const API_KEY = "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w342";

// Target the grid container
const moviesGrid = document.getElementById("moviesGrid");

// Fetch popular movies on load
async function fetchPopularMovies() {
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();

        // Clear grid
        moviesGrid.innerHTML = "";

        // Loop through movies
        data.results.forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");

            movieCard.innerHTML = `
                <img src="${IMG_BASE_URL + movie.poster_path}" alt="${movie.title}" />
                <h3>${movie.title}</h3>
                <p class="release-date">${new Date(movie.release_date).getFullYear()}</p>
                <p class="rating">⭐ ${movie.vote_average.toFixed(1)}</p>
            `;

            moviesGrid.appendChild(movieCard);
        });

    } catch (error) {
        console.error("Error fetching popular movies:", error);
        moviesGrid.innerHTML = "<p>⚠️ Failed to load movies.</p>";
    }
}

// Call function when page loads
fetchPopularMovies();
