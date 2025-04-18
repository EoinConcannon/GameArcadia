import React from 'react';
import '../styles/AboutPage.css';

const AboutPage = () => {
    return (
        <div className="about-container">
            <section className="about-hero">
                <h1>GAME ARCADIA</h1>
                <p className="tagline">2024 - 2025 Final Year Project</p>
            </section>

            <section className="about-mission">
                <h2>Our Mission</h2>
                <p>
                    GameArcadia represents
                    the fusion of cutting-edge technology and gaming passion. We've built a
                    neon-lit marketplace where gamers can discover titles that resonate with their
                    unique tastes through our neural recommendation systems.
                </p>
            </section>

            <section className="about-features">
                <h2>Platform Features</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <h3>Neural Recommendations</h3>
                        <p>Our algorithm decodes your gaming preferences to cater to your tastes.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Digital Identity</h3>
                        <p>Create your digital account, track your virtual library.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Secure Transactions</h3>
                        <p>State-of-the-art encryption protects every credit transfer in our digital marketplace.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Games</h3>
                        <p>From indie pixel art masterpieces to AAA virtual reality experiences, our store has everything.</p>
                    </div>
                </div>
            </section>

            <section className="about-tech">
                <h2>Tech Architecture</h2>
                <p>
                    GameArcadia runs on a React neural network with Supabase data storage
                    and Stripe secure transaction protocols. RAWG API was integrated
                    for comprehensive game data synchronisation, ensuring our users always have
                    access to the latest digital experiences.
                </p>
            </section>

            <section className="about-team">
                <h2>The Team</h2>
                <p>
                    GameArcadia was a solo final year project which showcased neural
                    programming in frontend development, API integration, and cybersecurity.
                </p>
            </section>

            <section className="about-future">
                <h2>Future Updates</h2>
                <p>
                    GameArcadia will have user reviews, social connectivity and
                    enhanced predictive recommendation algorithms.
                </p>
            </section>

            <section className="about-contact">
                <h2>Contact Us</h2>
                <p>
                    Want to learn more about GameArcadia?
                    Direct your questions to one of our admins.
                </p>
            </section>
        </div>
    );
};

export default AboutPage;