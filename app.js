// ########## SETUP
const express = require('express');
const app = express();

app.use(express.json());

const PORT = 3000;

// In-memory storage
let lists = [];
let nextId = 1;

// ########## ROUTES

// Get all lists
app.get('/api/lists', (req, res) => {
    res.json(lists);
});

// Create list
app.post('/api/lists', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const newList = { id: nextId++, name, items: [] };
    lists.push(newList);
    res.status(201).json(newList);
});

// Add item to list
app.post('/api/lists/:id/items', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Item name required' });

    const item = { name, packed: false };
    list.items.push(item);

    res.status(201).json(item);
});

// Toggle item packed
app.put('/api/lists/:id/items/:index', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const item = list.items[req.params.index];
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.packed = !item.packed;
    res.json(item);
});

// Delete list
app.delete('/api/lists/:id', (req, res) => {
    const index = lists.findIndex(l => l.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: 'List not found' });

    lists.splice(index, 1);
    res.json({ success: true });
});

// Delete item
app.delete('/api/lists/:id/items/:index', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const item = list.items.splice(req.params.index, 1);
    if (!item.length) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true });
});

// ########## START
app.listen(PORT, () => {
    console.log(`List microservice running at http://localhost:${PORT}`);
});
