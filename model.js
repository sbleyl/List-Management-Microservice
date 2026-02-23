require('dotenv').config()
const fs = require('fs').promises; 

class List {
    constructor(name, id) {
        this.id = id
        this.list_name = name
        this.items = []
    }
}

class Item {
    constructor(name, id, type) {
        this.id = id;
        this.item_name = name;
        this.type = type;
        this.completed = false;
    }
}

// Reads and returns contents of a text file, return null if unable to read file
async function readTextFile(filename) {
    try {
        const contents = await fs.readFile(filename, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Unable to open ${filename}: ${err}`); // This isn't running =(
                    return
                }

                return data
            })

        return contents
    } catch (err) {
        console.error(`Unable to read file: ${err}`)
        return null
    }

}

// Reads JSON file and returns contents as JavaScript object, returns null if unable to read file
async function readJSONFile(filename) {

    try {
        const json_data = await fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                console.error(err); // This isn't running either =(
                return
            }
            return data
        });
        return JSON.parse(json_data);
    } catch(err) {
        console.error(`Unable to read file: ${err}`)
        return null;
    }

}

// Write to JSON file
/* 
receives a file path as a string and contents as a JavaScript object and writes the contents to the specified file
returns true if file save successful, false otherwise
*/
async function writeJSONFile(filename, contents) {
    try {
        await fs.writeFile(filename, JSON.stringify(contents, null, 2))
        return true
    } catch (err) {
        console.error(`Unable to write to ${filename}: ${err}`)
        return false
    }
}

// Write to text file
/*
returns true if file written successfully, false otherwise
*/
async function writeTextFile(filename, contents) {
    try {
        await fs.writeFile(filename, contents, null, 2)
        return true
    } catch (err) {
        console.error(`Unable to create ${filename}: ${err}`)
        return false
    }
}

// Returns an ID unique within this app
async function getNewId() {
    const last_id = await readTextFile(process.env.ID_FILE_PATH);
    const new_id = Number(last_id) + 1;
    await writeTextFile(process.env.ID_FILE_PATH, String(new_id));
    return new_id
}

// Create a list
/* 
Returns list object if succesfully created, otherwise returns null
*/
const createList = async function createList(list_name) {
    // Get a unique ID for the new list
    const list_id = await getNewId();

    // Create a List object and save it in a json file
    const new_list = new List(list_name, list_id);
    const file_name = process.env.LISTS_FILE_PATH + list_id + '.json'
    const list_created = await writeJSONFile(file_name, new_list)
    // Add list to list of lists
    const lists = await readJSONFile(process.env.ALL_LISTS);
    list_header = [ Number, String];
    list_header = [ list_id, list_name ];
    lists.all.push( list_header );
    writeJSONFile(process.env.ALL_LISTS, lists);

    if (list_created) {
        return new_list
    } else {
        return null
    }
}

// Get a list
/* 
Returns list as JSON object, if it exists, otherwise returns null
*/
const viewList = async function viewList(list_id) {
    const file_name = process.env.LISTS_FILE_PATH + String(list_id) + '.json';
    const list = await readJSONFile(file_name);
    if (!list) {
        return null;
    } 
    return list;
}

// Delete a list
/* 
Returns null if deleted, returns 404 if list does not exist, returns 500 otherwise
*/
const deleteList = async function deleteList(list_id) {
    try {
        const file_path = process.env.LISTS_FILE_PATH + String(list_id) + '.json'
        const isDeleted = await fs.unlink(file_path) 

        // Remove the list from the list of lists
        let lists = await readJSONFile(process.env.ALL_LISTS);
        let list_headers = lists.all;

        // Find the item on the list
        for (let i=0; i<lists.all.length; i++) {
            if (list_headers[i][0] === list_id) {
                list_headers.splice(i, 1)
                break
            }
        }
        lists.all = list_headers;

        const lists_updated = await writeJSONFile(process.env.ALL_LISTS, lists);
        return null
    } catch (err) {
        console.error(err);
        if (err.code === 'ENOENT') {
            return 404
        }
        return 500
    }
}

// Get all lists
/* 
Returns a js list of all List objects, returns null if error reading lists
*/
const getAllLists = async function getAllLists() {
    const lists = await readJSONFile(process.env.ALL_LISTS);

    if (lists === null) {
        console.error(`Unable to read ${process.env.ALL_LISTS}`);
        return null;
    }

    const list_headers = lists.all;
    let mega_list = []
    for (let i=0; i<list_headers.length; i++) {
        const next_list = await viewList(list_headers[i][0]);
        mega_list.push(next_list);
    }

    return { "lists": mega_list}
}

// Add item to list
/* 
Returns object with item if item added, otherwise returns object with error messaage
Return object format: { "error": {"code": code, "message": "error message"} } or { "item": Item{} }
*/
const addItem = async function addItem(list_id, item_name, type) {
    //generate unique id and create item
    const new_id = await getNewId();
    const new_item = new Item(item_name, new_id, type);

    //open the list
    const file_name = process.env.LISTS_FILE_PATH + list_id + '.json'
    let list = await readJSONFile(file_name);
    if (list === null) {
        return { "error": { "code": 404, "message": "List not found"} };
    }

    list.items.push(new_item);
    const file_saved = await writeJSONFile(file_name, list);
    
    if (file_saved) {
        return { "item": new_item };
    }

    return { "error": { "code": 500, "message": "Unable to add item: Internal server error"} };

}

// Toggle item completed
/* 
Returns an object which contains updated item if change successful, otherwise contans error message
Return object format: { "error": {"code": code, "message": "error message"} } or { "item": Item{} }
*/
const toggleCompleted = async function toggleCompleted(list_id, item_id) {
    // Get the list
    const file_name = process.env.LISTS_FILE_PATH + list_id + '.json';
    let list = await readJSONFile(file_name)
    if (list === null) {
        return { "error": { "code": 404, "message": "List not found" } }
    }
    // Update the item's status and get the updated item
    let items = list.items;
    let item = null;
    for (let i = 0; i<items.length; i++) {
        if (items[i].id === Number(item_id)) {
            items[i].completed = !items[i].completed;
            item = items[i];
            break;
        }
    }
    if (item === null) {
        return { "error": { "code": 404, "message": "Item not found" } }
    }

    // Resave the updated list
    const list_updated = await writeJSONFile(file_name, list);
    if (list_updated) {
        return { "item": item};
    }

    return { "error": { "code": 500, "message": "Internal server error" } };
}

// Delete item
/* 
Returns object { "success": true } if item deleted, otherwise, returns error message
Return object format: { "error": { "code": code, "messaage": "error message" } } or null
*/
const deleteItem = async function deleteItem(list_id, item_id) {
    // Get the list
    const file_name = process.env.LISTS_FILE_PATH + list_id + '.json';
    let list = await readJSONFile(file_name);
    if (list === null) {
        return { "error": { "code": 404, "message": "List not found"} };
    }

    // Remove the item
    let item_deleted = false;
    let items = list.items;

    for (let i=0; i<items.length; i++) {
        if (items[i].id === Number(item_id)) {
            items = items.splice(i,1);
            item_deleted = true;
            break;
        }
    }

    if (!item_deleted) {
        return { "error": { "code": 404, "message": "Item not found"}}
    }

    // Resave the updated list
    const list_updated = await writeJSONFile(file_name, list);
    if (list_updated) {
        return { "success": true }
    }

    return { "error": { "code": 500, "message": "Internal server error"}}
}



module.exports = { viewList, createList, deleteList, addItem, toggleCompleted, deleteItem, getAllLists };