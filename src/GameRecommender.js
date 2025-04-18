import rawgService from './rawgService';

class GameRecommender {
    constructor(userInventory, genreMapper = null) {
        this.userInventory = userInventory || [];
        this.genreMapper = genreMapper;
    }

    // Entry point for getting recommendations
    async getRecommendations() {
        console.log('Starting game recommendations');

        // Fallback to simple recommendations if input is missing
        if (!this.userInventory || this.userInventory.length === 0) {
            console.log('No user inventory, falling back to simple recommendations');
            return this.simpleRecommendations();
        }

        if (!this.genreMapper) {
            console.log('No genre mapper, falling back to simple recommendations');
            return this.simpleRecommendations();
        }

        try {
            const recommendations = await this.advancedGenreBasedRecommendations();

            console.log('Advanced recommendations:', recommendations.length);

            // If not enough recommendations, add more using alternative strategies
            if (recommendations.length < 6) {
                const fallbackRecommendations = [
                    ...await this.getGenreBasedRecommendations(),
                    ...await this.getRelatedGenreRecommendations()
                ];

                console.log('Fallback recommendations:', fallbackRecommendations.length);

                recommendations.push(...fallbackRecommendations);
            }

            // Deduplicate recommendations and limit to 6
            const uniqueRecommendations = Array.from(
                new Map(recommendations.map(game => [game.id, game])).values()
            ).slice(0, 6);

            console.log('Final unique recommendations:', uniqueRecommendations.length);
            return uniqueRecommendations;

        } catch (error) {
            console.error('Error in recommendations:', error);
            return this.simpleRecommendations();
        }
    }

    // Uses genre weights and complementary genres to recommend games
    async advancedGenreBasedRecommendations() {
        console.log('Starting advanced genre-based recommendations');

        const userInventory = Array.isArray(this.userInventory) ? this.userInventory : [];

        // Flatten user genres into a list
        const userGenres = userInventory.flatMap(game =>
            (game.genres || []).map(genre => genre.name)
        );
        console.log('User Genres:', userGenres);

        // Build genre preference score map
        const genrePreferences = {};
        userGenres.forEach(genre => {
            const weight = this.genreMapper.getGenreWeight(genre);
            genrePreferences[genre] = (genrePreferences[genre] || 0) + weight;
        });
        console.log('Genre Preferences:', genrePreferences);

        const recommendations = [];
        const processedGameIds = new Set(userInventory.map(game => game.id));

        // Sort genres by preference (high to low)
        const sortedGenres = Object.entries(genrePreferences)
            .sort((a, b) => b[1] - a[1]);

        // For each preferred genre, fetch relevant and complementary games
        for (const [genre, preference] of sortedGenres) {
            const complementaryGenres = this.genreMapper.getComplementaryGenres(genre);
            console.log(`Fetching games for genre "${genre}" with preference ${preference}`);

            const genreLimit = Math.max(1, Math.min(5, Math.ceil(preference)));

            const genreGames = await this.fetchGamesByGenres([genre, ...complementaryGenres]);

            const newRecommendations = genreGames
                .filter(game => !processedGameIds.has(game.id))
                .slice(0, genreLimit);

            recommendations.push(...newRecommendations);
            newRecommendations.forEach(game => processedGameIds.add(game.id));
        }

        console.log('Advanced recommendations:', recommendations.length);
        return recommendations;
    }

    // Fetches games from related genres
    async getRelatedGenreRecommendations() {
        console.log('Starting related genre recommendations');

        const userInventory = Array.isArray(this.userInventory) ? this.userInventory : [];

        const userGenres = userInventory.flatMap(game =>
            (game.genres || []).map(genre => genre.name)
        );

        const expandedGenres = userGenres.flatMap(genre =>
            this.genreMapper.getRelatedGenres(genre)
        );

        const processedGameIds = new Set(userInventory.map(game => game.id));

        try {
            const allGames = await rawgService.getAllGames(3); // Get a broader selection

            const relatedGames = allGames
                .filter(game =>
                    game.genres &&
                    game.genres.some(genre =>
                        expandedGenres.includes(genre.name)
                    ) &&
                    !processedGameIds.has(game.id)
                )
                .slice(0, 6);

            console.log('Related genre recommendations:', relatedGames.length);
            return relatedGames;
        } catch (error) {
            console.error('Error in related genre recommendations:', error);
            return [];
        }
    }

    // Fetch games matching any of the given genres
    async fetchGamesByGenres(genres) {
        console.log('Fetching games for genres:', genres);

        try {
            let allGames = await rawgService.getAllGames();
            allGames = Array.isArray(allGames) ? allGames : [];

            const filteredGames = allGames.filter(game =>
                game.genres && Array.isArray(game.genres) &&
                game.genres.some(genre =>
                    genres.includes(genre.name)
                )
            );

            console.log('Total games:', allGames.length);
            console.log('Filtered games:', filteredGames.length);

            return filteredGames;
        } catch (error) {
            console.error('Error fetching games by genres:', error);
            return [];
        }
    }

    // Basic genre matching without weights or relationships
    async getGenreBasedRecommendations() {
        console.log('Starting genre-based recommendations');

        const userInventory = Array.isArray(this.userInventory) ? this.userInventory : [];

        const userGenres = userInventory.flatMap(game =>
            (game.genres || []).map(genre => genre.name)
        );

        try {
            let allGames = await rawgService.getAllGames();
            allGames = Array.isArray(allGames) ? allGames : [];

            const recommendations = allGames
                .filter(game =>
                    game.genres && Array.isArray(game.genres) &&
                    game.genres.some(genre =>
                        userGenres.includes(genre.name)
                    )
                )
                .slice(0, 6);

            console.log('Genre-based recommendations:', recommendations.length);
            return recommendations;
        } catch (error) {
            console.error('Error in genre-based recommendations:', error);
            return [];
        }
    }

    // Fallback method with no logic—just fetches a few games
    async simpleRecommendations() {
        console.log('Falling back to simple recommendations');
        try {
            let allGames = await rawgService.getAllGames();
            allGames = Array.isArray(allGames) ? allGames : [];

            return allGames.slice(0, 6);
        } catch (error) {
            console.error('Error in simple recommendations:', error);
            return [];
        }
    }
}

export default GameRecommender;
