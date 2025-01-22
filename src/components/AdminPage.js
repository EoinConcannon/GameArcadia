import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AdminPage = ({ loggedInUser }) => {
    const [users, setUsers] = useState([]); // State to store users
    const [games, setGames] = useState([]); // State to store games
    const [newGame, setNewGame] = useState({
        name: '',
        description: '',
        price: '',
    }); // State for the add game form
    const [editGame, setEditGame] = useState(null); // State to track the game being edited
    const [error, setError] = useState(null); // State to handle errors
    const [message, setMessage] = useState(''); // State for success or error messages

    // Fetch users and games from Supabase
    useEffect(() => {
        const fetchData = async () => {
            if (loggedInUser?.role === 'admin') {
                try {
                    // Fetch users
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('username, email, role');
                    if (userError) throw userError;
                    setUsers(userData);

                    // Fetch games
                    const { data: gameData, error: gameError } = await supabase
                        .from('games')
                        .select('*');
                    if (gameError) throw gameError;
                    setGames(gameData);
                } catch (err) {
                    console.error('Error fetching data:', err);
                    setError('Failed to fetch data');
                }
            }
        };

        fetchData();
    }, [loggedInUser]);

    // Handle input changes for adding or editing a game
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewGame((prev) => ({ ...prev, [name]: value }));
    };

    // Handle adding a new game
    const handleAddGame = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const { data, error } = await supabase.from('games').insert([newGame]);
            if (error) throw error;
            setGames((prev) => [...prev, ...data]);
            setNewGame({ name: '', description: '', price: '' });
            setMessage('Game added successfully!');
        } catch (err) {
            console.error('Error adding game:', err);
            setMessage('Failed to add game.');
        }
    };

    // Handle editing a game
    const handleEditGame = async (id) => {
        try {
            const { data, error } = await supabase
                .from('games')
                .update(editGame)
                .eq('id', id);
            if (error) throw error;
            setGames((prev) => prev.map((game) => (game.id === id ? data[0] : game)));
            setEditGame(null); // Clear edit state
            setMessage('Game updated successfully!');
        } catch (err) {
            console.error('Error updating game:', err);
            setMessage('Failed to update game.');
        }
    };

    // Handle deleting a game
    const handleDeleteGame = async (id) => {
        try {
            const { error } = await supabase.from('games').delete().eq('id', id);
            if (error) throw error;
            setGames((prev) => prev.filter((game) => game.id !== id));
            setMessage('Game deleted successfully!');
        } catch (err) {
            console.error('Error deleting game:', err);
            setMessage('Failed to delete game.');
        }
    };

    // Restrict access if the logged-in user is not an admin
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        return <p className="text-danger">Access Denied</p>;
    }

    return (
        <div className="admin-page">
            <h2>Admin Page</h2>
            {error && <p className="text-danger">{error}</p>}
            {message && <p className="text-success">{message}</p>}

            {/* User List */}
            <div className="users-list mb-5">
                <h3>List of Users</h3>
                {users.length > 0 ? (
                    <ul>
                        {users.map((user, index) => (
                            <li key={index}>
                                <strong>{user.username}</strong> - {user.email}{' '}
                                {user.role === 'admin' && (
                                    <span style={{ color: 'red', fontWeight: 'bold' }}> (Admin)</span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No users found.</p>
                )}
            </div>

            {/* List of Games */}
            <div className="games-list">
                <h3>List of Games</h3>
                {games.length > 0 ? (
                    <ul>
                        {games.map((game) => (
                            <li key={game.id}>
                                {editGame?.id === game.id ? (
                                    <div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editGame.name}
                                            onChange={(e) =>
                                                setEditGame((prev) => ({ ...prev, name: e.target.value }))
                                            }
                                        />
                                        <textarea
                                            name="description"
                                            value={editGame.description}
                                            onChange={(e) =>
                                                setEditGame((prev) => ({ ...prev, description: e.target.value }))
                                            }
                                        />
                                        <input
                                            type="number"
                                            name="price"
                                            value={editGame.price}
                                            onChange={(e) =>
                                                setEditGame((prev) => ({ ...prev, price: e.target.value }))
                                            }
                                        />
                                        <button
                                            onClick={() => handleEditGame(game.id)}
                                            className="btn btn-success btn-sm"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditGame(null)}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <strong>{game.name}</strong> - {game.description} (€{game.price})
                                        <button
                                            onClick={() => setEditGame(game)}
                                            className="btn btn-warning btn-sm mx-2"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGame(game.id)}
                                            className="btn btn-danger btn-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No games found.</p>
                )}
            </div>

            {/* Add Game Form */}
            <div className="add-game-form mb-5">
                <h3>Add New Game</h3>
                <form onSubmit={handleAddGame}>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">Game Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-control"
                            value={newGame.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-control"
                            value={newGame.description}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="price" className="form-label">Price (€)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            className="form-control"
                            value={newGame.price}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Add Game</button>
                </form>
            </div>
        </div>
    );
};

export default AdminPage;
