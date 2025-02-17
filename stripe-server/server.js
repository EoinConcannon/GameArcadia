const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); 

app.use(cors());
app.use(bodyParser.json());

app.post('/api/create-payment-intent', async (req, res) => {
    const { items } = req.body;

    // Calculate the total price
    const amount = items.reduce((total, item) => total + item.price * 100, 0); // Amount in cents

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'eur',
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});