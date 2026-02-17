// ########## SETUP

// Express for API routes and calls
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('frontend')); // serves your frontend folder

const PORT = 3000;

// In-memory storage for lists
let lists = [];
let nextId = 1;
let nextItemId = 1;

// ########## ROUTES

// Home Page
app.get('/lists', (req, res) => {
    res.sendFile(__dirname + '/frontend/lists.html');
});

// API to get all lists as JSON
app.get('/api/lists', (req, res) => {
    res.json(lists);
});

// Create a new packing list
app.post('/lists', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const newList = { id: nextId++, name, items: [] };
    lists.push(newList);
    res.json(lists);
});

// Get all items for a list
app.get('/lists/:listId/items', (req, res) => {
    const listId = parseInt(req.params.listId);
    const list = lists.find(l => l.id === listId);

    if (!list) return res.status(404).json({ error: 'List not found' });

    res.json(list.items);
});

// Add item to list
app.post('/lists/:listId/items', (req, res) => {
    const listId = parseInt(req.params.listId);
    const { name } = req.body;

    const list = lists.find(l => l.id === listId);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (!name) return res.status(400).json({ error: 'Item name required' });

    const newItem = { id: nextItemId++, name, completed: false };
    list.items.push(newItem);

    res.json(list.items);
});

// Update item status
app.put('/lists/:listId/items/:itemId', (req, res) => {
    const listId = parseInt(req.params.listId);
    const itemId = parseInt(req.params.itemId);
    const { completed } = req.body;

    const list = lists.find(l => l.id === listId);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const item = list.items.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.completed = completed;
    res.json(item);
});

// Delete item
app.delete('/lists/:listId/items/:itemId', (req, res) => {
    const listId = parseInt(req.params.listId);
    const itemId = parseInt(req.params.itemId);

    const list = lists.find(l => l.id === listId);
    if (!list) return res.status(404).json({ error: 'List not found' });

    list.items = list.items.filter(i => i.id !== itemId);
    res.json(list.items);
});

// ########## LISTENER

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});