import rawgService from './rawgService';

class GameRecommender {
    constructor(userInventory, genreMapper = null) {
        this.userInventory = userInventory || [];
        this.genreMapper = genreMapper;
    }

    async getRecommendations() {
        console.log('Starting game recommendations');

        // Validate inputs
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

            // If not enough recommendations, use more methods
            if (recommendations.length < 6) {
                const fallbackRecommendations = [
                    ...await this.getGenreBasedRecommendations(),
                    ...await this.getRelatedGenreRecommendations()
                ];

                console.log('Fallback recommendations:', fallbackRecommendations.length);

                recommendations.push(...fallbackRecommendations);
            }

            // Ensure unique recommendations
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

    async advancedGenreBasedRecommendations() {
        console.log('Starting advanced genre-based recommendations');

        // Ensure userInventory is an array
        const userInventory = Array.isArray(this.userInventory) ? this.userInventory : [];

        // Collect user's genres from inventory
        const userGenres = userInventory.flatMap(game =>
            (game.genres || []).map(genre => genre.name)
        );
        console.log('User Genres:', userGenres);

        // Calculate genre diversity and preferences
        const genrePreferences = {};
        userGenres.forEach(genre => {
            const weight = this.genreMapper.getGenreWeight(genre);
            genrePreferences[genre] = (genrePreferences[genre] || 0) + weight;
        });
        console.log('Genre Preferences:', genrePreferences);

        // Get games across preferred and complementary genres
        const recommendations = [];
        const processedGameIds = new Set(userInventory.map(game => game.id));

        // Sort genre entries by preference score (highest first)
        const sortedGenres = Object.entries(genrePreferences)
            .sort((a, b) => b[1] - a[1]); // Sort by preference value

        // Then use the sorted entries in your loop
        for (const [genre, preference] of sortedGenres) {
            // Get complementary genres to explore
            const complementaryGenres = this.genreMapper.getComplementaryGenres(genre);

            console.log(`Fetching games for genre "${genre}" with preference ${preference}`);

            // Use preference to determine how many games to include from each genre
            const genreLimit = Math.max(1, Math.min(5, Math.ceil(preference)));

            // Fetch games in primary and complementary genres
            const genreGames = await this.fetchGamesByGenres([genre, ...complementaryGenres]);

            // Filter out already owned or processed games
            const newRecommendations = genreGames
                .filter(game => !processedGameIds.has(game.id))
                .slice(0, genreLimit);  // Use preference to determine how many to include

            recommendations.push(...newRecommendations);
            newRecommendations.forEach(game => processedGameIds.add(game.id));
        }

        console.log('Advanced recommendations:', recommendations.length);
        return recommendations;
    }

    async getRelatedGenreRecommendations() {
        console.log('Starting related genre recommendations');

        // Ensure userInventory is an array
        const userInventory = Array.isArray(this.userInventory) ? this.userInventory : [];

        const userGenres = userInventory.flatMap(game =>
            (game.genres || []).map(genre => genre.name)
        );

        const expandedGenres = userGenres.flatMap(genre =>
            this.genreMapper.getRelatedGenres(genre)
        );

        const processedGameIds = new Set(userInventory.map(game => game.id));

        try {
            const allGames = await rawgService.getAllGames(3);  // Fetch more games

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

    async fetchGamesByGenres(genres) {
        console.log('Fetching games for genres:', genres);

        try {
            // Fetch all games from RAWG service
            let allGames = await rawgService.getAllGames();

            // Ensure allGames is an array
            allGames = Array.isArray(allGames) ? allGames : [];

            // Filter games that match any of the specified genres
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

    async getGenreBasedRecommendations() {
        console.log('Starting genre-based recommendations');

        // Ensure userInventory is an array
        const userInventory = Array.isArray(this.userInventory) ? this.userInventory : [];

        const userGenres = userInventory.flatMap(game =>
            (game.genres || []).map(genre => genre.name)
        );

        try {
            let allGames = await rawgService.getAllGames();

            // Ensure allGames is an array
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

    async simpleRecommendations() {
        console.log('Falling back to simple recommendations');
        try {
            let allGames = await rawgService.getAllGames();

            // Ensure allGames is an array
            allGames = Array.isArray(allGames) ? allGames : [];

            return allGames.slice(0, 6);
        } catch (error) {
            console.error('Error in simple recommendations:', error);
            return [];
        }
    }
}

export default GameRecommender;