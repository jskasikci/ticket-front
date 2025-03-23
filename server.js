const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));

AWS.config.update({
    region: "eu-central-1",
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

app.get('/api/seats', async (req, res) => {
    const params = {
        TableName: 'Seats',
        ScanIndexForward: true,
    };

    try {
        const data = await dynamoDB.scan(params).promise();
        data.Items.sort((a, b) => a.ID - b.ID);
        res.json(data.Items);
    } catch (err) {
        res.status(500).send('Error fetching seat data');
    }
});

app.put('/ticket', async (req, res) => {
    let { seatIds } = req.query;

    if (!seatIds || seatIds.length === 0) {
        return res.status(400).json({ error: 'No seats provided' });
    }

    if (typeof seatIds === 'string') {
        seatIds = [seatIds];
    }

    try {
        const response = await fetch(`http://52.59.255.103:8081/ticket?seatIds=${seatIds.join('&seatIds=')}`, {
            method: 'PUT',
        });

        if (!response.ok) {
            throw new Error(`Failed to reserve seats. Status: ${response.status}, Message: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Error reserving seats' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
