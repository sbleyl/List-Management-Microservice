require('dotenv').config()
const model = require('./model');


// ########## SETUP
const express = require('express');
const app = express();

app.use(express.json());

// ########## ROUTES

// Get all lists
app.get('/api/lists', async (req, res) => {
    const lists = await model.getAllLists();
    if (lists === null) {
        return res.status(500).json( { error: 'Internal server error' })
    }
    res.status(200).json(lists);
});

// Get all items in a list
app.get('/api/lists/:id/items', async (req, res) => {
    const list = await model.viewList(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    res.status(200).type('application/json').send(list);
});

// Create list
app.post('/api/lists', async (req, res) => {
    const { list_name } = req.body;
    if (!list_name) return res.status(400).json({ error: 'Name required' });

    const list = await model.createList(list_name);
    if (!list) return res.status(500).type('application/json').send({ "error": "Unable to create list"});
    res.status(201).type('application/json').send(list);
});

// Add item to list
app.post('/api/lists/:id/items', async (req, res) => {
    const { item_name, type } = req.body;
    if (!item_name) return res.status(400).json({ error: 'Item name required' });

    result = await model.addItem(req.params.id, item_name, type);

    if (Object.hasOwn(result, 'item')) {
        return res.status(201).json(result.item);
    }
    res.status(result.error.code).json({ error: result.error.message })
});

// Toggle item completed
app.put('/api/lists/:id/items/:itemId', async (req, res) => {

    const result = await model.toggleCompleted(req.params.id, req.params.itemId)

    if (Object.hasOwn(result, 'item')) {
        return res.status(200).type('application/json').send(result.item);
    }

    return res.status(result.error.code).json({ error: result.error.message });

});

// Delete list
app.delete('/api/lists/:id', async (req, res) => {
    const error = await model.deleteList(Number(req.params.id));
    if (error === null) {
        return res.status(204).send()
    } else if (error === 404) {
        return res.status(404).json({ error: "List not found."})
    };
    res.status(500).json({ error: "Unable to delete: Server error."})
});

// Delete item
app.delete('/api/lists/:id/items/:itemId', async (req, res) => {
    const result = await model.deleteItem(req.params.id, req.params.itemId);

    if (Object.hasOwn(result, "success")) {
        return res.status(204).send();
    }

    if (Object.hasOwn(result, "error")) {
        return res.status(result.error.code).json( {error: result.error.message} );
    }

    return res.status(500).json( { error: "Internal server error" } )

});

// ########## START
app.listen(process.env.PORT, () => {
    console.log(`List microservice running at http://localhost:${process.env.PORT}`);
});
