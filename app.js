// ########## SETUP
const express = require('express');
const app = express();

app.use(express.json());

const PORT = 3000;

// In-memory storage
let lists = [];
let nextId = 1;
let nextItemId = 1;

// ########## ROUTES

// Get all lists
app.get('/api/lists', (req, res) => {
    res.json(lists);
});

// Get all items in a list
app.get('/api/lists/:id/items', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    res.json(list.items);
});

// Create list
app.post('/api/lists', (req, res) => {
    const { list_name } = req.body;
    if (!list_name) return res.status(400).json({ error: 'Name required' });

    const newList = { id: nextId++, list_name, items: [] };
    lists.push(newList);
    res.status(201).json(newList);
});

// Add item to list
app.post('/api/lists/:id/items', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const { item_name } = req.body;
    if (!item_name) return res.status(400).json({ error: 'Item name required' });

    const item = { id: nextItemId++, item_name, packed: false };
    list.items.push(item);

    res.status(201).json(item);
});

// Toggle item packed
app.put('/api/lists/:id/items/:itemId', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const item = list.items.find(i => i.id == req.params.itemId);
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
app.delete('/api/lists/:id/items/:itemId', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    
    const index = list.items.findIndex(i => i.id == req.params.itemId);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });

    list.items.splice(index, 1);
    res.json({ success: true });
});

// ########## START
app.listen(PORT, () => {
    console.log(`List microservice running at http://localhost:${PORT}`);
});
