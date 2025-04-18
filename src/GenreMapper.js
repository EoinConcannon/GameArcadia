class GenreMapper {
    constructor() {
        this.genreWeights = {};
        this.complementaryGenreMap = {};
        this.genreGraph = {};
    }

    // Initializes genre relationships and weights based on a list of games
    async initializeGenreMappings(games) {
        games = Array.isArray(games) ? games : [];

        const genreCoOccurrence = {};
        const genreFrequency = {};
        const genreGraph = {};

        games.forEach(game => {
            const genres = (game.genres || []).map(g => g.name);

            // Track genre frequency and initialize graph nodes
            genres.forEach(genre => {
                genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
                if (!genreGraph[genre]) {
                    genreGraph[genre] = new Set();
                }
            });

            // Build connections between genres that co-occur
            for (let i = 0; i < genres.length; i++) {
                for (let j = i + 1; j < genres.length; j++) {
                    genreGraph[genres[i]].add(genres[j]);
                    genreGraph[genres[j]].add(genres[i]);

                    const pair = [genres[i], genres[j]].sort();
                    const key = pair.join('|');
                    genreCoOccurrence[key] = (genreCoOccurrence[key] || 0) + 1;
                }
            }
        });

        this.genreGraph = genreGraph;

        // Calculate weights with log-scaling and slight de-emphasis of lower-ranked genres
        this.genreWeights = Object.fromEntries(
            Object.entries(genreFrequency)
                .sort((a, b) => b[1] - a[1])
                .map(([genre, count], index) => [
                    genre,
                    Math.log(count + 1) * (6 - index * 0.2)
                ])
        );

        this.complementaryGenreMap = this.generateComplementaryGenres(genreCoOccurrence);
    }

    // Returns least frequent co-occurring genres as complements
    generateComplementaryGenres(genreCoOccurrence) {
        const complementaryGenres = {};

        Object.keys(this.genreWeights).forEach(baseGenre => {
            const complementCandidates = Object.entries(genreCoOccurrence)
                .filter(([key]) => key.includes(baseGenre))
                .map(([key, count]) => {
                    const otherGenre = key.split('|').find(g => g !== baseGenre);
                    return { genre: otherGenre, count };
                })
                .sort((a, b) => a.count - b.count) // Favor less frequent co-occurrences
                .slice(0, 3)
                .map(item => item.genre);

            complementaryGenres[baseGenre] = complementCandidates;
        });

        return complementaryGenres;
    }

    // Returns weight of a genre, fallback to 1 if unknown
    getGenreWeight(genre) {
        return this.genreWeights[genre] || 1;
    }

    // Returns complementary genres for a given genre
    getComplementaryGenres(genre) {
        return this.complementaryGenreMap[genre] || [];
    }

    // Returns related genres by traversing the genre graph up to a certain depth
    getRelatedGenres(genre, depth = 2) {
        const relatedGenres = new Set();
        const visited = new Set();
        const queue = [[genre, 0]];

        while (queue.length > 0) {
            const [currentGenre, currentDepth] = queue.shift();

            if (currentDepth >= depth) break;
            if (visited.has(currentGenre)) continue;

            visited.add(currentGenre);

            const neighbors = this.genreGraph[currentGenre] || new Set();
            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    relatedGenres.add(neighbor);
                    queue.push([neighbor, currentDepth + 1]);
                }
            });
        }

        return Array.from(relatedGenres);
    }
}

export default GenreMapper;
